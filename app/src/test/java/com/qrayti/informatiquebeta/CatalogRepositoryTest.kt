package com.qrayti.informatiquebeta

import org.junit.Assert.assertEquals
import org.junit.Test

class CatalogRepositoryTest {
    @Test
    fun normalize_removesFrenchAccentsAndPunctuation() {
        assertEquals("reseaux telecom", CatalogRepository.normalize("Réseaux — Télécom"))
    }

    @Test
    fun normalize_unifiesCommonArabicLetterVariants() {
        assertEquals("اداره الملفات", CatalogRepository.normalize("إدارةُ الملفات"))
        assertEquals("جامعه", CatalogRepository.normalize("جامعة"))
    }

    @Test
    fun normalize_collapsesWhitespace() {
        assertEquals("java avance", CatalogRepository.normalize("  Java___avancé  "))
    }
}
