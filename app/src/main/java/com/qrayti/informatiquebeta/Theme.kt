package com.qrayti.informatiquebeta

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class AppTheme { LIGHT, DARK, POP }

object QraytiColors {
    val ElectricBlue = Color(0xFF4B5FFF)
    val Cyan = Color(0xFF00C7D9)
    val Violet = Color(0xFF8B5CF6)
    val Gold = Color(0xFFFFA940)
    val Midnight = Color(0xFF061126)
    val Success = Color(0xFF17B890)
}

private val DarkColors = darkColorScheme(
    primary = Color(0xFFAFC1FF),
    onPrimary = Color(0xFF092264),
    primaryContainer = Color(0xFF253A91),
    onPrimaryContainer = Color(0xFFE1E7FF),
    secondary = Color(0xFF69E7F0),
    onSecondary = Color(0xFF00363B),
    secondaryContainer = Color(0xFF004F57),
    tertiary = Color(0xFFFFBC7A),
    tertiaryContainer = Color(0xFF653B00),
    background = QraytiColors.Midnight,
    surface = Color(0xFF0B1830),
    surfaceVariant = Color(0xFF152641),
    surfaceContainer = Color(0xFF101F38),
    surfaceContainerHigh = Color(0xFF182A47),
    outline = Color(0xFF6E7E9D),
    onBackground = Color(0xFFF5F7FF),
    onSurface = Color(0xFFF5F7FF),
)
private val LightColors = lightColorScheme(
    primary = Color(0xFF4054E8),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFE1E7FF),
    onPrimaryContainer = Color(0xFF101C63),
    secondary = Color(0xFF007B86),
    secondaryContainer = Color(0xFFB8F4F8),
    tertiary = Color(0xFF975000),
    tertiaryContainer = Color(0xFFFFDDB8),
    background = Color(0xFFF3F7FC),
    surface = Color.White,
    surfaceVariant = Color(0xFFE8F0F8),
    surfaceContainer = Color(0xFFECF3FA),
    surfaceContainerHigh = Color(0xFFE3EAF7),
    outline = Color(0xFF75809A),
)

private val PopColors = lightColorScheme(
    primary = Color(0xFFB018C5),
    onPrimary = Color.White,
    primaryContainer = Color(0xFFF7D9FF),
    onPrimaryContainer = Color(0xFF4E075C),
    secondary = Color(0xFF7047E8),
    onSecondary = Color.White,
    secondaryContainer = Color(0xFFE8DFFF),
    tertiary = Color(0xFF9A6200),
    onTertiary = Color.White,
    tertiaryContainer = Color(0xFFFFE3A2),
    onTertiaryContainer = Color(0xFF3C2500),
    background = Color(0xFFFFF6FD),
    surface = Color(0xFFFFFBFF),
    surfaceVariant = Color(0xFFF5E8F6),
    surfaceContainer = Color(0xFFFFECFA),
    surfaceContainerHigh = Color(0xFFF2DFF2),
    outline = Color(0xFF8A6F89),
)

private val QraytiTypography = Typography(
    displaySmall = TextStyle(fontSize = 36.sp, lineHeight = 42.sp, fontWeight = FontWeight.Black),
    headlineLarge = TextStyle(fontSize = 32.sp, lineHeight = 38.sp, fontWeight = FontWeight.Black),
    headlineMedium = TextStyle(fontSize = 27.sp, lineHeight = 33.sp, fontWeight = FontWeight.Black),
    titleLarge = TextStyle(fontSize = 22.sp, lineHeight = 28.sp, fontWeight = FontWeight.ExtraBold),
    titleMedium = TextStyle(fontSize = 17.sp, lineHeight = 23.sp, fontWeight = FontWeight.ExtraBold),
    bodyLarge = TextStyle(fontSize = 16.sp, lineHeight = 25.sp),
    bodyMedium = TextStyle(fontSize = 14.sp, lineHeight = 22.sp),
    labelLarge = TextStyle(fontSize = 14.sp, lineHeight = 20.sp, fontWeight = FontWeight.Bold),
)

private val QraytiShapes = Shapes(
    extraSmall = RoundedCornerShape(12.dp),
    small = RoundedCornerShape(16.dp),
    medium = RoundedCornerShape(22.dp),
    large = RoundedCornerShape(30.dp),
    extraLarge = RoundedCornerShape(38.dp),
)

@Composable
fun QraytiTheme(theme: AppTheme = AppTheme.LIGHT, content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = when(theme){AppTheme.LIGHT->LightColors;AppTheme.DARK->DarkColors;AppTheme.POP->PopColors},
        typography = QraytiTypography,
        shapes = QraytiShapes,
        content = content,
    )
}
