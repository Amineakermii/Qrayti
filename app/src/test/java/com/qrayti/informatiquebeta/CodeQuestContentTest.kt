package com.qrayti.informatiquebeta

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class CodeQuestContentTest {
    @Test fun languagesAndChallengesAreComplete() {
        assertEquals(listOf("java", "c", "python"), CodeQuestContent.all.map { it.id })
        CodeQuestContent.all.forEach { language ->
            assertEquals("${language.name} should have a full first world", 9, language.challenges.size)
            assertEquals(3, language.challenges.map { it.mode }.distinct().size)
        }
    }

    @Test fun everyAnswerIsValidAndEveryIdIsUnique() {
        val challenges = CodeQuestContent.all.flatMap { it.challenges }
        assertEquals(challenges.size, challenges.map { it.id }.distinct().size)
        challenges.forEach { challenge ->
            assertTrue(challenge.options.size >= 3)
            assertTrue(challenge.answer in challenge.options.indices)
            assertTrue(challenge.explanation.length >= 18)
        }
    }

    @Test fun eachLanguageHasItsOwnWorldAndMascot() {
        val languages = CodeQuestContent.all
        assertEquals(languages.size, languages.map { it.mascot }.distinct().size)
        assertEquals(languages.size, languages.map { it.world }.distinct().size)
        assertNotEquals(languages[0].color, languages[1].color)
        assertNotEquals(languages[1].color, languages[2].color)
    }
}
