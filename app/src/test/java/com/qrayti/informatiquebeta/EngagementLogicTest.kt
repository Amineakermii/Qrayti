package com.qrayti.informatiquebeta

import org.junit.Assert.assertEquals
import org.junit.Test

class EngagementLogicTest {
    private val day = 24 * 60 * 60 * 1_000L

    @Test fun launcherMoodTracksInactivityThresholds() {
        assertEquals(LauncherMood.FRESH, LauncherMood.fromInactiveMillis(0))
        assertEquals(LauncherMood.FRESH, LauncherMood.fromInactiveMillis(3 * day - 1))
        assertEquals(LauncherMood.TIRED, LauncherMood.fromInactiveMillis(3 * day))
        assertEquals(LauncherMood.TIRED, LauncherMood.fromInactiveMillis(10 * day - 1))
        assertEquals(LauncherMood.OLD, LauncherMood.fromInactiveMillis(10 * day))
    }
}
