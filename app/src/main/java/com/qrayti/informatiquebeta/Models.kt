package com.qrayti.informatiquebeta

data class CourseFile(
    val id: String,
    val licence: String,
    val year: Int,
    val semester: Int,
    val track: String,
    val name: String,
    val displayName: String,
    val size: Long,
    val sizeText: String,
    val subjectId: String,
    val subjectName: String,
    val category: String,
    val categoryName: String,
    val group: String,
    val kind: String,
    val path: String,
    val sourceUniversity: String,
    val sourceInstitution: String,
    val sourceInstructor: String,
    val dynamic: Boolean = false,
    val assetUrl: String? = null,
    val downloadUrl: String? = null,
) {
    val extension: String get() = name.substringAfterLast('.', "").lowercase()
    val readUrl: String get() = when {
        !assetUrl.isNullOrBlank() -> absolute(assetUrl)
        path.startsWith("http") -> path
        else -> "${BuildConfig.BASE_URL}/${path.trimStart('/')}"
    }
    val saveUrl: String get() = when {
        !downloadUrl.isNullOrBlank() -> absolute(downloadUrl)
        else -> readUrl
    }
    private fun absolute(v: String): String = if (v.startsWith("http")) v else "${BuildConfig.BASE_URL}/${v.trimStart('/')}"
}

data class SubjectSummary(
    val id: String,
    val name: String,
    val count: Int,
    val sources: List<String>,
)

data class SemesterKey(val licence: String, val year: Int, val semester: Int, val track: String = "common")

data class FaqItem(val question: String, val answer: String)

data class MascotChoice(val label: String, val reply: String)
data class MascotScenario(val prompt: String, val choices: List<MascotChoice>, val weight: Int = 1)

data class GradeFormula(val id: String, val label: String, val tp: Double, val ds: Double, val exam: Double)

data class GradeRow(
    val subjectId: String,
    val subjectName: String,
    val coefficient: Double = 1.0,
    val formulaId: String = "mixte",
    val tp: String = "",
    val ds: String = "",
    val exam: String = "",
    val excluded: Boolean = false,
)

object GradeFormulas {
    val all = listOf(
        GradeFormula("mixte", "Mixte — TP 10% + DS 20% + Examen 70%", .10, .20, .70),
        GradeFormula("controle_continue", "Contrôle continu — TP 20% + DS 40% + Examen 40%", .20, .40, .40),
        GradeFormula("tp30_ds70", "TP 30% + DS 70%", .30, .70, 0.0),
        GradeFormula("quarter_exam2", "(TP + DS + Examen × 2) ÷ 4", .25, .25, .50),
        GradeFormula("tp_ds_half", "(TP + DS) ÷ 2", .50, .50, 0.0),
        GradeFormula("prep_35_65", "Prépa — TP 35% + DS 65%", .35, .65, 0.0),
        GradeFormula("prep_15_25_60", "TP 15% + DS 25% + Examen 60%", .15, .25, .60),
        GradeFormula("prep_15_35_50", "TP 15% + DS 35% + Examen 50%", .15, .35, .50),
        GradeFormula("prep_35_25_40", "TP 35% + DS 25% + Examen 40%", .35, .25, .40),
        GradeFormula("other_10_10_80", "TP 10% + DS 10% + Examen 80%", .10, .10, .80),
    )
}

object ProgrammeNames {
    fun licenceName(id: String) = when (id) {
        "info" -> "Sciences de l’Informatique"
        "lce" -> "Licence Computer Engineering"
        "lt" -> "Licence Télécommunications"
        else -> id.uppercase()
    }
    fun licenceArabic(id: String) = when (id) {
        "info" -> "علوم الإعلامية"
        "lce" -> "هندسة الحاسوب"
        "lt" -> "الاتصالات"
        else -> id
    }
}
