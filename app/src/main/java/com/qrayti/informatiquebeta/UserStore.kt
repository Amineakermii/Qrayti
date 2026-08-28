package com.qrayti.informatiquebeta

import android.content.Context
import org.json.JSONArray

class UserStore(context: Context) {
    private val p = context.getSharedPreferences("qrayti_beta", Context.MODE_PRIVATE)

    var selectedLicence: String
        get() = p.getString("licence","info") ?: "info"
        set(v) { p.edit().putString("licence",v).apply() }
    var selectedYear: Int
        get() = p.getInt("year",1)
        set(v) { p.edit().putInt("year",v).apply() }
    var selectedSemester: Int
        get() = p.getInt("semester",1)
        set(v) { p.edit().putInt("semester",v).apply() }
    var selectedTrack: String
        get() = p.getString("track","common") ?: "common"
        set(v) { p.edit().putString("track",v).apply() }

    var appTheme: AppTheme
        get() = runCatching { AppTheme.valueOf(p.getString("theme", AppTheme.LIGHT.name)!!) }
            .getOrDefault(AppTheme.LIGHT)
        set(value) { p.edit().putString("theme", value.name).apply() }

    val profileName: String get() = p.getString("profile_name", "") ?: ""
    val profileAge: String get() = p.getString("profile_age", "") ?: ""
    val universityId: String get() = p.getString("university_id", "") ?: ""
    val facultyName: String get() = p.getString("faculty_name", "") ?: ""
    fun onboardingComplete(): Boolean = p.getBoolean("onboarding_complete", false)
    fun saveProfile(name:String,age:String,universityId:String,faculty:String){
        p.edit().putString("profile_name",name).putString("profile_age",age).putString("university_id",universityId).putString("faculty_name",faculty).putBoolean("onboarding_complete",true).apply()
    }
    fun resetOnboarding() = p.edit().putBoolean("onboarding_complete",false).apply()

    fun favorites(): Set<String> = p.getStringSet("favorites", emptySet())?.toSet() ?: emptySet()
    fun toggleFavorite(id: String): Boolean {
        val s = favorites().toMutableSet(); val added = if (id in s) { s.remove(id); false } else { s.add(id); true }
        p.edit().putStringSet("favorites",s).apply(); return added
    }
    fun recent(): List<String> = runCatching {
        val a = JSONArray(p.getString("recent","[]")); List(a.length()) { a.getString(it) }
    }.getOrElse { emptyList() }
    fun markRecent(id: String) {
        val list = recent().toMutableList(); list.remove(id); list.add(0,id)
        while(list.size>20) list.removeAt(list.lastIndex)
        p.edit().putString("recent",JSONArray(list).toString()).apply()
    }
    fun searchHistory(): List<String> = runCatching {
        val values = JSONArray(p.getString("search_history", "[]")); List(values.length()) { values.getString(it) }
    }.getOrElse { emptyList() }
    fun rememberSearch(query: String) {
        val clean = query.trim().take(80)
        if (clean.length < 2) return
        val values = searchHistory().toMutableList(); values.removeAll { it.equals(clean, ignoreCase = true) }; values.add(0, clean)
        while (values.size > 8) values.removeAt(values.lastIndex)
        p.edit().putString("search_history", JSONArray(values).toString()).apply()
    }
    fun clearSearchHistory() = p.edit().remove("search_history").apply()
    fun lastFile(): String? = p.getString("last_file",null)
    fun setLastFile(id: String) = p.edit().putString("last_file",id).apply()

    fun clearHistory() = p.edit().remove("recent").remove("last_file").apply()

    fun lastUpdateCheck(): Long = p.getLong("last_update_check", 0L)
    fun markUpdateChecked() = p.edit().putLong("last_update_check", System.currentTimeMillis()).apply()
    fun skippedUpdate(): Int = p.getInt("skipped_update", -1)
    fun shouldDelayUpdate(versionCode:Int):Boolean = skippedUpdate()==versionCode && System.currentTimeMillis()-p.getLong("skipped_update_at",0L)<24*60*60*1_000L
    fun skipUpdate(versionCode: Int) = p.edit().putInt("skipped_update", versionCode).putLong("skipped_update_at",System.currentTimeMillis()).apply()
    fun shouldShowWelcome13(): Boolean = !p.getBoolean("welcome_13", false)
    fun markWelcome13Seen() = p.edit().putBoolean("welcome_13", true).apply()
    fun shouldShowWelcome14(): Boolean = !p.getBoolean("welcome_14", false)
    fun markWelcome14Seen() = p.edit().putBoolean("welcome_14", true).apply()
    fun shouldShowWelcome15(): Boolean = !p.getBoolean("welcome_15", false)
    fun markWelcome15Seen() = p.edit().putBoolean("welcome_15", true).apply()
    fun lastActive(): Long = p.getLong("last_active", System.currentTimeMillis())
    fun markActive() = p.edit().putLong("last_active", System.currentTimeMillis()).apply()
    fun lastReminder(): Long = p.getLong("last_reminder", 0L)
    fun markReminderSent() = p.edit().putLong("last_reminder", System.currentTimeMillis()).apply()

    fun excludedSubjects(key: SemesterKey): Set<String> = p.getStringSet("excluded_${key.licence}_${key.year}_${key.semester}_${key.track}", emptySet())?.toSet() ?: emptySet()
    fun toggleExcluded(key: SemesterKey, subjectId: String): Boolean {
        val s = excludedSubjects(key).toMutableSet(); val excluded = if(subjectId in s){s.remove(subjectId);false}else{s.add(subjectId);true}
        p.edit().putStringSet("excluded_${key.licence}_${key.year}_${key.semester}_${key.track}",s).apply(); return excluded
    }

    fun codeQuestXp(language: String): Int = p.getInt("code_quest_xp_$language", 0)
    fun codeQuestStreak(language: String): Int = p.getInt("code_quest_streak_$language", 0)
    fun codeQuestBestStreak(language: String): Int = p.getInt("code_quest_best_$language", 0)
    fun codeQuestCompleted(language: String): Set<String> = p.getStringSet("code_quest_done_$language", emptySet())?.toSet() ?: emptySet()
    fun recordCodeQuestAnswer(language: String, challengeId: String, correct: Boolean): Int {
        val current = codeQuestStreak(language)
        val nextStreak = if (correct) current + 1 else 0
        val completed = codeQuestCompleted(language).toMutableSet()
        val firstClear = correct && completed.add(challengeId)
        val earned = when { !correct -> 0; firstClear -> 12; else -> 2 }
        p.edit()
            .putInt("code_quest_xp_$language", codeQuestXp(language) + earned)
            .putInt("code_quest_streak_$language", nextStreak)
            .putInt("code_quest_best_$language", maxOf(codeQuestBestStreak(language), nextStreak))
            .putStringSet("code_quest_done_$language", completed)
            .apply()
        return earned
    }
}
