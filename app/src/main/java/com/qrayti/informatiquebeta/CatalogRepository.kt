package com.qrayti.informatiquebeta

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.text.Normalizer
import java.util.concurrent.ConcurrentHashMap

/**
 * Source of truth for bundled courses and files published later through Admin.
 * The bundled catalogue is parsed/indexed once; remote semester data is cached for offline use.
 */
class CatalogRepository(context: Context) {
    private val appContext = context.applicationContext
    private val remoteCache = ConcurrentHashMap<SemesterKey, List<CourseFile>>()
    private val remoteCacheTimes = ConcurrentHashMap<SemesterKey, Long>()
    private val cacheDirectory = File(appContext.cacheDir, "catalog-v1").apply { mkdirs() }

    @Volatile private var staticFiles: List<CourseFile>? = null
    @Volatile private var staticById: Map<String, CourseFile>? = null
    @Volatile private var searchIndex: List<SearchEntry>? = null

    suspend fun allStatic(): List<CourseFile> = withContext(Dispatchers.IO) {
        staticFiles ?: synchronized(this@CatalogRepository) {
            staticFiles ?: parseBundledCatalogue().also { files ->
                staticFiles = files
                staticById = files.associateBy(CourseFile::id)
                searchIndex = files.map(::SearchEntry)
            }
        }
    }

    suspend fun fileById(id: String): CourseFile? {
        allStatic()
        return staticById?.get(id) ?: remoteCache.values.asSequence().flatten().firstOrNull { it.id == id }
    }

    suspend fun filesByIds(ids: Collection<String>): List<CourseFile> {
        if (ids.isEmpty()) return emptyList()
        allStatic()
        val remoteById = remoteCache.values.asSequence().flatten().associateBy(CourseFile::id)
        return ids.mapNotNull { staticById?.get(it) ?: remoteById[it] }
    }

    suspend fun semesterFiles(key: SemesterKey, refresh: Boolean = false): List<CourseFile> {
        val bundled = allStatic().filter { it.belongsTo(key) }
        val remote = withContext(Dispatchers.IO) {
            val memory = remoteCache[key]
            val disk = if(memory == null) readDiskCache(key) else emptyList()
            val cached = memory ?: disk
            val fetchedAt = remoteCacheTimes[key] ?: cacheFile(key).lastModified()
            val shouldRefresh = refresh || System.currentTimeMillis() - fetchedAt >= REMOTE_REFRESH_MS
            if(shouldRefresh) {
                fetchRemote(key).onSuccess { remoteCacheTimes[key] = System.currentTimeMillis() }.getOrElse { cached }
            } else {
                cached
            }
        }
        remoteCache[key] = remote
        return mergeUnique(bundled, remote)
    }

    suspend fun search(query: String): List<CourseFile> = withContext(Dispatchers.Default) {
        allStatic()
        val normalizedQuery = normalize(query)
        if (normalizedQuery.length < 2) return@withContext emptyList()
        val tokens = normalizedQuery.split(' ').filter { it.length > 1 }
        val dynamicIndex = remoteCache.values.asSequence().flatten().distinctBy(CourseFile::id).map(::SearchEntry)

        (searchIndex.orEmpty().asSequence() + dynamicIndex)
            .mapNotNull { entry -> entry.score(normalizedQuery, tokens).takeIf { it > 0 }?.let { it to entry.file } }
            .sortedWith(compareByDescending<Pair<Int, CourseFile>> { it.first }.thenBy { normalize(it.second.displayName) })
            .distinctBy { it.second.id }
            .take(MAX_SEARCH_RESULTS)
            .map { it.second }
            .toList()
    }

    fun subjects(files: List<CourseFile>): List<SubjectSummary> = files
        .groupBy(CourseFile::subjectId)
        .map { (id, subjectFiles) ->
            SubjectSummary(
                id = id,
                name = subjectFiles.firstOrNull()?.subjectName ?: id,
                count = subjectFiles.size,
                sources = subjectFiles.mapNotNull { file ->
                    listOfNotNull(file.sourceUniversity, file.sourceInstitution, file.sourceInstructor.takeIf(String::isNotBlank)?.let { "الأستاذ: $it" })
                        .filter(String::isNotBlank)
                        .joinToString(" — ")
                        .takeIf(String::isNotBlank)
                }.distinct().take(4),
            )
        }
        .sortedBy { normalize(it.name) }

    private fun parseBundledCatalogue(): List<CourseFile> = appContext.assets
        .open("catalog.json")
        .bufferedReader()
        .use { reader ->
            val items = JSONObject(reader.readText()).getJSONArray("items")
            buildList(items.length()) {
                for (index in 0 until items.length()) add(parseStatic(items.getJSONObject(index)))
            }
        }

    private fun fetchRemote(key: SemesterKey): Result<List<CourseFile>> = runCatching {
        val query = "licence=${key.licence}&year=${key.year}&semester=${key.semester}&track=${key.track}"
        val connection = URL("${BuildConfig.BASE_URL}/api/catalog?$query").openConnection() as HttpURLConnection
        connection.apply {
            requestMethod = "GET"
            connectTimeout = 6_000
            readTimeout = 9_000
            useCaches = false
            setRequestProperty("Accept", "application/json")
            setRequestProperty("User-Agent", "Qrayti-Android/${BuildConfig.VERSION_NAME}")
        }
        try {
            check(connection.responseCode in 200..299) { "HTTP ${connection.responseCode}" }
            val root = JSONObject(connection.inputStream.bufferedReader().use { it.readText() })
            val array = root.optJSONArray("files") ?: JSONArray()
            buildList(array.length()) {
                for (index in 0 until array.length()) add(parseRemote(array.getJSONObject(index), key))
            }.also { writeDiskCache(key, it) }
        } finally {
            connection.disconnect()
        }
    }

    private fun writeDiskCache(key: SemesterKey, files: List<CourseFile>) {
        runCatching {
            val array = JSONArray()
            files.forEach { array.put(it.toRemoteJson()) }
            val target = cacheFile(key)
            val temporary = File(target.parentFile, "${target.name}.tmp")
            temporary.writeText(JSONObject().put("files", array).toString())
            if (target.exists()) target.delete()
            temporary.renameTo(target)
        }
    }

    private fun readDiskCache(key: SemesterKey): List<CourseFile> = runCatching {
        val target = cacheFile(key)
        if (!target.isFile) return@runCatching emptyList()
        val array = JSONObject(target.readText()).optJSONArray("files") ?: return@runCatching emptyList()
        buildList(array.length()) {
            for (index in 0 until array.length()) add(parseRemote(array.getJSONObject(index), key))
        }
    }.getOrElse { emptyList() }

    private fun cacheFile(key: SemesterKey) = File(
        cacheDirectory,
        "${key.licence}-${key.year}-${key.semester}-${key.track.replace(Regex("[^a-zA-Z0-9_-]"), "_")}.json",
    )

    private fun parseStatic(value: JSONObject) = CourseFile(
        id = value.optString("id"), licence = value.optString("licence"), year = value.optInt("year", 1),
        semester = value.optInt("semester", 1), track = value.optString("track", "common"),
        name = value.optString("name"), displayName = value.optString("displayName", value.optString("name")),
        size = value.optLong("size"), sizeText = value.optString("sizeText"),
        subjectId = value.optString("subjectId"), subjectName = value.optString("subjectName"),
        category = value.optString("category", "extra"), categoryName = value.optString("categoryName", "Fichiers"),
        group = value.optString("group"), kind = value.optString("kind"), path = value.optString("path"),
        sourceUniversity = value.optString("sourceUniversity"), sourceInstitution = value.optString("sourceInstitution"),
        sourceInstructor = value.optString("sourceInstructor"),
    )

    private fun parseRemote(value: JSONObject, key: SemesterKey) = CourseFile(
        id = value.optString("id"), licence = key.licence, year = key.year, semester = key.semester,
        track = value.optString("track", key.track), name = value.optString("name"),
        displayName = value.optString("displayName", value.optString("name")), size = value.optLong("size"),
        sizeText = value.optString("sizeText"), subjectId = value.optString("subject", value.optString("subjectId")),
        subjectName = value.optString("subjectName"), category = value.optString("category", "extra"),
        categoryName = value.optString("categoryName", "Fichiers"), group = value.optString("group"),
        kind = value.optString("kind"), path = "", sourceUniversity = value.optString("sourceUniversity"),
        sourceInstitution = value.optString("sourceInstitution"), sourceInstructor = value.optString("sourceInstructor"), dynamic = true,
        assetUrl = value.optString("assetUrl").takeIf(String::isNotBlank),
        downloadUrl = value.optString("downloadUrl").takeIf(String::isNotBlank),
    )

    private fun CourseFile.toRemoteJson() = JSONObject()
        .put("id", id).put("track", track).put("name", name).put("displayName", displayName)
        .put("size", size).put("sizeText", sizeText).put("subject", subjectId).put("subjectName", subjectName)
        .put("category", category).put("categoryName", categoryName).put("group", group).put("kind", kind)
        .put("sourceUniversity", sourceUniversity).put("sourceInstitution", sourceInstitution).put("sourceInstructor", sourceInstructor)
        .put("assetUrl", assetUrl).put("downloadUrl", downloadUrl)

    private data class SearchEntry(val file: CourseFile) {
        val title = normalize(file.displayName)
        val subject = normalize(file.subjectName)
        val metadata = normalize(listOf(file.name, file.group, file.categoryName, file.sourceUniversity, file.sourceInstitution, file.sourceInstructor, file.extension).joinToString(" "))

        fun score(query: String, tokens: List<String>): Int = when {
            title == query -> 120
            title.startsWith(query) -> 100
            subject == query -> 95
            subject.startsWith(query) -> 80
            title.contains(query) -> 70
            subject.contains(query) -> 60
            metadata.contains(query) -> 35
            tokens.isNotEmpty() && tokens.all { title.contains(it) || subject.contains(it) || metadata.contains(it) } -> 20
            else -> 0
        }
    }

    companion object {
        private const val REMOTE_REFRESH_MS = 60 * 1_000L
        private const val MAX_SEARCH_RESULTS = 160

        internal fun normalize(value: String): String = Normalizer.normalize(value.lowercase(), Normalizer.Form.NFD)
            .replace(Regex("\\p{Mn}+"), "")
            .replace(Regex("[أإآٱ]"), "ا").replace('ى', 'ي').replace('ة', 'ه')
            .replace('ؤ', 'و').replace('ئ', 'ي')
            .replace(Regex("[^\\p{L}\\p{N}]+"), " ").trim()
    }
}

private fun CourseFile.belongsTo(key: SemesterKey): Boolean =
    licence == key.licence && year == key.year && semester == key.semester &&
        (track == key.track || track == "common" || key.track == "common")

private fun mergeUnique(first: List<CourseFile>, second: List<CourseFile>): List<CourseFile> {
    val seen = HashSet<String>(first.size + second.size)
    return buildList(first.size + second.size) {
        first.forEach { if (seen.add(it.id)) add(it) }
        second.forEach { if (seen.add(it.id)) add(it) }
    }
}
