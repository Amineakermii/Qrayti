package com.qrayti.informatiquebeta

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.Bolt
import androidx.compose.material.icons.rounded.BugReport
import androidx.compose.material.icons.rounded.CheckCircle
import androidx.compose.material.icons.rounded.Code
import androidx.compose.material.icons.rounded.EmojiEvents
import androidx.compose.material.icons.rounded.Favorite
import androidx.compose.material.icons.rounded.LockOpen
import androidx.compose.material.icons.rounded.PlayArrow
import androidx.compose.material.icons.rounded.Refresh
import androidx.compose.material.icons.rounded.Terminal
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.runtime.CompositionLocalProvider
import kotlinx.coroutines.delay

enum class CodeGameMode(val title: String, val icon: String, val buddy: String, val buddyName: String) {
    OUTPUT("Output Rush", "⚡", "🚀", "Roxy"),
    MISSING("Complete Code", "🧩", "🛠️", "Fixy"),
    BUG("Bug Hunt", "🐛", "🕵️", "Debug"),
}

data class CodeChallenge(
    val id: String,
    val mode: CodeGameMode,
    val title: String,
    val prompt: String,
    val code: String,
    val options: List<String>,
    val answer: Int,
    val explanation: String,
)

data class CodeLanguage(
    val id: String,
    val name: String,
    val arabicName: String,
    val mascot: String,
    val mascotName: String,
    val world: String,
    val hook: String,
    val color: Color,
    val accent: Color,
    val challenges: List<CodeChallenge>,
)

object CodeQuestContent {
    val java = CodeLanguage(
        id = "java", name = "Java", arabicName = "Java", mascot = "🤖", mascotName = "Javi",
        world = "Robot Factory", hook = "Build commands, run the robot, and learn OOP step by step.",
        color = Color(0xFFF26B38), accent = Color(0xFFFFC857),
        challenges = listOf(
            CodeChallenge("java_1",CodeGameMode.OUTPUT,"Start the Engine","What does the code print?","int energy = 4;\nenergy += 3;\nSystem.out.println(energy);",listOf("4","7","43"),1,"+= adds 3 to 4. The answer is 7."),
            CodeChallenge("java_2",CodeGameMode.MISSING,"Text Box","Choose the correct type for text.","___ hero = \"Javi\";\nSystem.out.println(hero);",listOf("int","String","boolean"),1,"Java stores text in String. The S is big."),
            CodeChallenge("java_3",CodeGameMode.BUG,"Factory Door","The robot can enter when energy is 5 or more. Fix the condition.","if (energy > 5) {\n  openDoor();\n}",listOf("energy >= 5","energy = 5","energy != 5"),0,">= means more than or equal to. = only saves a value."),
            CodeChallenge("java_4",CodeGameMode.OUTPUT,"Robot Line","How many robots does the code print?","for (int i = 0; i < 3; i++) {\n  System.out.print(\"🤖\");\n}",listOf("2 times","3 times","4 times"),1,"i is 0, then 1, then 2. The loop stops before 3."),
            CodeChallenge("java_5",CodeGameMode.MISSING,"Parts Box","Get the first item in the array.","int[] parts = {8, 3, 9};\nint first = parts[___];",listOf("0","1","3"),0,"Array positions start at 0. The first item is parts[0]."),
            CodeChallenge("java_6",CodeGameMode.BUG,"Badge Check","Compare the text inside the String.","if (badge == \"GOLD\") {\n  unlock();\n}",listOf("badge.equals(\"GOLD\")","badge = \"GOLD\"","badge.compare"),0,"equals checks the text. == usually checks if both references are the same."),
            CodeChallenge("java_7",CodeGameMode.OUTPUT,"Function Machine","What does the function return?","int boost(int x) {\n  return x * 2;\n}\nSystem.out.println(boost(6));",listOf("6","8","12"),2,"The function gets 6 and returns 6 × 2 = 12."),
            CodeChallenge("java_8",CodeGameMode.MISSING,"New Robot","Which word creates a new object?","Robot r = ___ Robot(\"Javi\");",listOf("class","new","make"),1,"new calls the constructor and creates an object."),
            CodeChallenge("java_9",CodeGameMode.BUG,"Factory Key","The app needs the correct main method. Fix it.","public void main(String[] args) {\n  start();\n}",listOf("public static void main(String[] args)","static int main()","public main(String args)"),0,"The JVM starts with public static void main(String[] args)."),
        ),
    )

    val c = CodeLanguage(
        id = "c", name = "C", arabicName = "C", mascot = "🦾", mascotName = "Cee",
        world = "Memory Lab", hook = "Learn variables, loops, and pointers. Stop the bugs.",
        color = Color(0xFF2166D1), accent = Color(0xFF42D6C8),
        challenges = listOf(
            CodeChallenge("c_1",CodeGameMode.OUTPUT,"Lab Screen","What does the code print?","int x = 5;\nprintf(\"%d\", x + 2);",listOf("5","7","%d"),1,"%d shows a whole number. x + 2 is 7."),
            CodeChallenge("c_2",CodeGameMode.MISSING,"Energy Number","Complete the decimal number.","___ energy = 7.5f;",listOf("int","float","char"),1,"float stores a number with a decimal point. f marks it as a float."),
            CodeChallenge("c_3",CodeGameMode.BUG,"Age Scanner","scanf needs the address of the variable.","int age;\nscanf(\"%d\", age);",listOf("scanf(\"%d\", &age);","scanf(age);","scanf(\"%f\", age);"),0,"&age gives scanf the address where it can save the age."),
            CodeChallenge("c_4",CodeGameMode.OUTPUT,"Number Split","C divides two whole numbers. What is the answer?","int result = 7 / 2;\nprintf(\"%d\", result);",listOf("3","3.5","4"),0,"int division removes the decimal part. 7 / 2 becomes 3."),
            CodeChallenge("c_5",CodeGameMode.MISSING,"Guard Loop","Complete the loop so it runs 4 times.","for (int i = 0; i ___ 4; i++) {\n  scan();\n}",listOf("<","<=","="),0,"It runs with 0, 1, 2, and 3. So use i < 4."),
            CodeChallenge("c_6",CodeGameMode.OUTPUT,"Code Box","What is codes[1]?","int codes[] = {10, 20, 30};\nprintf(\"%d\", codes[1]);",listOf("10","20","30"),1,"Array positions start at 0. Position 1 is the second item: 20."),
            CodeChallenge("c_7",CodeGameMode.MISSING,"Open the Pointer","p has the address of x. How do we read x with p?","int x = 9;\nint *p = &x;\nprintf(\"%d\", ___);",listOf("p","&p","*p"),2,"*p reads the value at the address. The value is 9."),
            CodeChallenge("c_8",CodeGameMode.BUG,"Memory Limit","The array has 3 items. Which loop is safe?","int a[3] = {1,2,3};\nfor(int i=0; i<=3; i++) sum += a[i];",listOf("i < 3","i <= 2 && i > 0","i < 4"),0,"The last position is 2. i < 3 keeps the loop inside the array."),
            CodeChallenge("c_9",CodeGameMode.OUTPUT,"Upgrade Function","What does the code print?","int upgrade(int n) { return n + 1; }\nprintf(\"%d\", upgrade(9));",listOf("9","10","91"),1,"The function returns n + 1. So upgrade(9) is 10."),
        ),
    )

    val python = CodeLanguage(
        id = "python", name = "Python", arabicName = "Python", mascot = "🐍", mascotName = "Bito",
        world = "Snake Garden", hook = "Grow your code from print and lists to functions and dictionaries.",
        color = Color(0xFF6B4FD3), accent = Color(0xFFF2C94C),
        challenges = listOf(
            CodeChallenge("python_1",CodeGameMode.OUTPUT,"First Plant","What does the code print?","score = 3\nscore += 2\nprint(score)",listOf("3","5","32"),1,"+= adds 2 to score. The new score is 5."),
            CodeChallenge("python_2",CodeGameMode.MISSING,"Plant a Name","Complete the welcome message.","name = \"Bito\"\n___(\"Hi\", name)",listOf("echo","print","printf"),1,"Python uses print() to show text."),
            CodeChallenge("python_3",CodeGameMode.BUG,"Space Gate","What is the correct fix?","if energy > 5\nprint(\"Go!\")",listOf("Add : and indent print","Change if to when","Add ; only"),0,"if ends with :. The code inside it must move to the right."),
            CodeChallenge("python_4",CodeGameMode.OUTPUT,"Range Path","What is the list?","steps = list(range(3))\nprint(steps)",listOf("[1, 2, 3]","[0, 1, 2]","[0, 1, 2, 3]"),1,"range(3) starts at 0 and stops before 3."),
            CodeChallenge("python_5",CodeGameMode.MISSING,"List Fruit","Get the last color.","colors = [\"red\", \"blue\", \"gold\"]\nlast = colors[___]",listOf("0","2","3"),1,"The positions are 0, 1, and 2. The last color is at position 2."),
            CodeChallenge("python_6",CodeGameMode.OUTPUT,"Snake Slice","What does the slice print?","word = \"PYTHON\"\nprint(word[0:2])",listOf("PY","PYT","YT"),0,"It starts at position 0 and stops before position 2. It prints PY."),
            CodeChallenge("python_7",CodeGameMode.BUG,"Equal Check","Check if score is equal to 10.","if score = 10:\n    win()",listOf("score == 10","score := 10","score equals 10"),0,"== compares two values. = saves a value."),
            CodeChallenge("python_8",CodeGameMode.MISSING,"Make a Function","Complete the function.","___ double(x):\n    return x * 2",listOf("fun","def","function"),1,"Python starts a function with def."),
            CodeChallenge("python_9",CodeGameMode.OUTPUT,"Treasure Dictionary","What is the answer?","hero = {\"name\": \"Bito\", \"xp\": 12}\nprint(hero[\"xp\"])",listOf("xp","12","Bito"),1,"The key \"xp\" gives the value 12."),
        ),
    )

    val all = listOf(java, c, python)
    fun byId(id: String): CodeLanguage = all.firstOrNull { it.id == id } ?: python
}

@Composable
fun CodeQuestHub(user: UserStore, onLanguage: (String) -> Unit) {
    var revision by remember { mutableIntStateOf(0) }
    val totalXp = remember(revision) { CodeQuestContent.all.sumOf { user.codeQuestXp(it.id) } }
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        item { CodeQuestHero(totalXp) }
        item {
            Text("Choose a world", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
            Text("Each language has its own game and mascot.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        items(CodeQuestContent.all, key = { it.id }) { language ->
            val completed = remember(revision) { user.codeQuestCompleted(language.id).size }
            val xp = remember(revision) { user.codeQuestXp(language.id) }
            LanguageWorldCard(language, completed, xp) { revision++; onLanguage(language.id) }
        }
        item {
            Surface(shape = RoundedCornerShape(24.dp), color = MaterialTheme.colorScheme.surfaceContainer) {
                Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text("💡", fontSize = 28.sp); Spacer(Modifier.width(10.dp))
                    Column { Text("Mistakes help you learn", fontWeight = FontWeight.Black); Text("Every answer has a short reason. Learn it, do not just remember it.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                }
            }
        }
        item { Spacer(Modifier.height(70.dp)) }
    }
}

@Composable
fun CodeQuestHomeBanner(user: UserStore, onClick: () -> Unit) {
    val totalXp = CodeQuestContent.all.sumOf { user.codeQuestXp(it.id) }
    Surface(onClick = onClick, shape = RoundedCornerShape(27.dp), color = Color(0xFF171B3A), border = BorderStroke(1.dp, QraytiColors.Violet.copy(.45f))) {
        Box(Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Color(0xFF171B3A), Color(0xFF31245F)))).padding(16.dp)) {
            Text("{ }", Modifier.align(Alignment.TopEnd), color = Color.White.copy(.10f), fontSize = 52.sp, fontFamily = FontFamily.Monospace, fontWeight = FontWeight.Black)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                    Text("🎮 CODE QUEST", color = Color(0xFFFFD166), fontWeight = FontWeight.Black, style = MaterialTheme.typography.labelLarge)
                    Text("Coding is now a game", color = Color.White, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                    Text("Java 🤖  •  C 🦾  •  Python 🐍", color = Color.White.copy(.72f), style = MaterialTheme.typography.bodySmall)
                    Text(if (totalXp > 0) "$totalXp XP • Keep playing" else "Start from zero and learn by playing", color = Color(0xFF9EE8DF), fontWeight = FontWeight.Bold, style = MaterialTheme.typography.labelMedium)
                }
                Surface(shape = CircleShape, color = Color.White.copy(.10f)) { Icon(Icons.Rounded.PlayArrow, "Start Code Quest", Modifier.padding(14.dp).size(29.dp), tint = Color.White) }
            }
        }
    }
}

@Composable
private fun CodeQuestHero(totalXp: Int) {
    val motion = rememberInfiniteTransition(label = "quest hero")
    val float by motion.animateFloat(-6f, 6f, infiniteRepeatable(tween(1600, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "quest mascots")
    Card(shape = RoundedCornerShape(32.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
        Box(Modifier.fillMaxWidth().height(190.dp).background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.primaryContainer, MaterialTheme.colorScheme.secondaryContainer)))) {
            Text("</>", Modifier.align(Alignment.TopStart).offset((-8).dp, 8.dp), color = MaterialTheme.colorScheme.primary.copy(.14f), fontSize = 56.sp, fontWeight = FontWeight.Black, fontFamily = FontFamily.Monospace)
            Column(Modifier.align(Alignment.CenterStart).padding(18.dp).fillMaxWidth(.66f), verticalArrangement = Arrangement.spacedBy(7.dp)) {
                Surface(shape = CircleShape, color = MaterialTheme.colorScheme.primary) { Text("CODE QUEST", Modifier.padding(horizontal = 10.dp, vertical = 5.dp), color = MaterialTheme.colorScheme.onPrimary, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black) }
                Text("Learn by playing", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                Text("Short missions, clear help, and saved progress.", style = MaterialTheme.typography.bodySmall)
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { Icon(Icons.Rounded.Bolt, null, Modifier.size(18.dp), tint = QraytiColors.Gold); Text("$totalXp total XP", fontWeight = FontWeight.Black) }
            }
            Column(Modifier.align(Alignment.CenterEnd).padding(18.dp).graphicsLayer { translationY = float }, horizontalAlignment = Alignment.CenterHorizontally) {
                Text("🤖🐍", fontSize = 48.sp); Text("🦾", fontSize = 42.sp)
            }
        }
    }
}

@Composable
private fun LanguageWorldCard(language: CodeLanguage, completed: Int, xp: Int, onClick: () -> Unit) {
    val progress = completed.toFloat() / language.challenges.size
    Surface(onClick = onClick, shape = RoundedCornerShape(28.dp), color = language.color.copy(.10f), border = BorderStroke(1.dp, language.color.copy(.24f))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Surface(shape = RoundedCornerShape(21.dp), color = language.color) { Text(language.mascot, Modifier.padding(13.dp), fontSize = 32.sp) }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) { Text(language.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black); Text("${language.world} • ${language.mascotName}", color = language.color, fontWeight = FontWeight.Bold) }
                Surface(shape = CircleShape, color = language.accent.copy(.22f)) { Text("$xp XP", Modifier.padding(horizontal = 10.dp, vertical = 6.dp), fontWeight = FontWeight.Black) }
            }
            Text(language.hook, style = MaterialTheme.typography.bodyMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) { CodeGameMode.entries.forEach { Text("${it.icon} ${it.title}", Modifier.background(language.color.copy(.08f), CircleShape).padding(horizontal = 8.dp, vertical = 5.dp), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold) } }
            LinearProgressIndicator(progress = { progress }, Modifier.fillMaxWidth().height(7.dp).clip(CircleShape), color = language.color, trackColor = language.color.copy(.12f))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("$completed/${language.challenges.size} missions", style = MaterialTheme.typography.labelMedium); Text(if (completed == language.challenges.size) "World complete 🏆" else "Play now →", color = language.color, fontWeight = FontWeight.Black) }
        }
    }
}

@Composable
fun CodeQuestGame(languageId: String, user: UserStore) {
    val language = remember(languageId) { CodeQuestContent.byId(languageId) }
    var run by remember(languageId) { mutableIntStateOf(0) }
    val completedAtStart = remember(languageId, run) { user.codeQuestCompleted(language.id) }
    val startIndex = remember(completedAtStart) { language.challenges.indexOfFirst { it.id !in completedAtStart }.let { if (it < 0) 0 else it } }
    var index by remember(languageId, run) { mutableIntStateOf(startIndex) }
    var selected by remember(languageId, run) { mutableStateOf<Int?>(null) }
    var hearts by remember(languageId, run) { mutableIntStateOf(3) }
    var earned by remember(languageId, run) { mutableIntStateOf(0) }
    var finished by remember(languageId, run) { mutableStateOf(false) }
    var won by remember(languageId, run) { mutableStateOf(false) }
    var showSpark by remember { mutableStateOf(false) }
    val challenge = language.challenges[index]
    val correct = selected == challenge.answer
    val xp = user.codeQuestXp(language.id)
    val streak = user.codeQuestStreak(language.id)

    LaunchedEffect(showSpark) { if (showSpark) { delay(900); showSpark = false } }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(horizontal = 15.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(13.dp),
    ) {
        item { GameStatusBar(language, index, hearts, xp, streak) }
        if (finished) {
            item { GameFinishCard(language, won, earned, user.codeQuestCompleted(language.id).size, user.codeQuestBestStreak(language.id)) { run++; finished = false; won = false } }
        } else {
            item { GameMascotScene(language, challenge.mode, correct.takeIf { selected != null }, showSpark) }
            item {
                AnimatedContent(challenge.id, transitionSpec = { (fadeIn(tween(250)) + slideInVertically { it / 6 }) togetherWith fadeOut(tween(120)) }, label = "challenge") {
                    ChallengeCard(challenge)
                }
            }
            items(challenge.options.indices.toList(), key = { "${challenge.id}_$it" }) { option ->
                AnswerOption(language, challenge, option, selected) {
                    if (selected != null) return@AnswerOption
                    selected = option
                    val isCorrect = option == challenge.answer
                    val gained = user.recordCodeQuestAnswer(language.id, challenge.id, isCorrect)
                    earned += gained
                    if (!isCorrect) hearts-- else showSpark = true
                }
            }
            item {
                AnimatedVisibility(selected != null, enter = fadeIn() + scaleIn(spring()), exit = fadeOut() + scaleOut()) {
                    FeedbackCard(language, correct, challenge.explanation, if (correct) user.codeQuestStreak(language.id) else 0) {
                        if (hearts <= 0) { won = false; finished = true }
                        else if (index == language.challenges.lastIndex) { won = true; finished = true }
                        else { index++; selected = null }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(70.dp)) }
    }
}

@Composable
private fun GameStatusBar(language: CodeLanguage, index: Int, hearts: Int, xp: Int, streak: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = language.color.copy(.12f)) { Text("${language.mascot} ${language.name}", Modifier.padding(horizontal = 10.dp, vertical = 6.dp), fontWeight = FontWeight.Black, color = language.color) }
            Spacer(Modifier.weight(1f))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("❤ $hearts", color = Color(0xFFE74C5B), fontWeight = FontWeight.Black)
                Text("🔥 $streak", color = Color(0xFFF28A2E), fontWeight = FontWeight.Black)
                Text("⚡ $xp", color = language.color, fontWeight = FontWeight.Black)
            }
        }
        LinearProgressIndicator(progress = { (index + 1f) / language.challenges.size }, Modifier.fillMaxWidth().height(8.dp).clip(CircleShape), color = language.color, trackColor = language.color.copy(.12f))
    }
}

@Composable
private fun GameMascotScene(language: CodeLanguage, mode: CodeGameMode, correct: Boolean?, spark: Boolean) {
    val motion = rememberInfiniteTransition(label = "language mascot")
    val bob by motion.animateFloat(-5f, 5f, infiniteRepeatable(tween(900, easing = FastOutSlowInEasing), RepeatMode.Reverse), label = "mascot bob")
    val line = when (correct) { true -> listOf("Great! The code works 🔥", "Your brain is getting stronger!", "Clean run! Keep going").random(); false -> "Small bug. Now we understand it 👀"; null -> when (mode) { CodeGameMode.OUTPUT -> "Run the code in your head first."; CodeGameMode.MISSING -> "One piece is missing. Can you find it?"; CodeGameMode.BUG -> "I can see a bug in this code 🐛" } }
    Surface(shape = RoundedCornerShape(28.dp), color = language.color.copy(.11f), border = BorderStroke(1.dp, language.color.copy(.18f))) {
        Box(Modifier.fillMaxWidth().padding(15.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(contentAlignment = Alignment.Center) {
                    Box(Modifier.size(72.dp).background(language.accent.copy(.20f), CircleShape))
                    Text("${language.mascot}${mode.buddy}", Modifier.graphicsLayer { translationY = bob }, fontSize = 38.sp)
                }
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) { Text("${language.mascotName} + ${mode.buddyName} • ${mode.icon} ${mode.title}", color = language.color, fontWeight = FontWeight.Black); Text(line, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Black) }
            }
            AnimatedVisibility(spark, Modifier.align(Alignment.TopEnd), enter = scaleIn(), exit = fadeOut()) { Text("✨ +XP ✨", color = language.color, fontWeight = FontWeight.Black) }
        }
    }
}

@Composable
private fun ChallengeCard(challenge: CodeChallenge) {
    Card(shape = RoundedCornerShape(27.dp), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface), border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(.12f))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) { Icon(when(challenge.mode){CodeGameMode.OUTPUT->Icons.Rounded.Terminal;CodeGameMode.MISSING->Icons.Rounded.Code;CodeGameMode.BUG->Icons.Rounded.BugReport}, null, tint = MaterialTheme.colorScheme.primary); Spacer(Modifier.width(8.dp)); Text(challenge.title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black) }
            Text(challenge.prompt, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Surface(shape = RoundedCornerShape(18.dp), color = Color(0xFF111827)) {
                    Text(challenge.code, Modifier.fillMaxWidth().padding(15.dp), color = Color(0xFFE7EDF7), fontFamily = FontFamily.Monospace, fontSize = 14.sp, lineHeight = 22.sp)
                }
            }
        }
    }
}

@Composable
private fun AnswerOption(language: CodeLanguage, challenge: CodeChallenge, option: Int, selected: Int?, onClick: () -> Unit) {
    val isAnswer = option == challenge.answer
    val isSelected = selected == option
    val color = when { selected != null && isAnswer -> QraytiColors.Success; selected != null && isSelected -> Color(0xFFE74C5B); else -> language.color }
    Surface(onClick = onClick, enabled = selected == null, shape = RoundedCornerShape(20.dp), color = if (selected != null && (isAnswer || isSelected)) color.copy(.13f) else MaterialTheme.colorScheme.surface, border = BorderStroke(if (isSelected || (selected != null && isAnswer)) 2.dp else 1.dp, color.copy(if (selected == null) .18f else .55f))) {
        Row(Modifier.fillMaxWidth().padding(14.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(shape = CircleShape, color = color.copy(.12f)) { Text(('A'.code + option).toChar().toString(), Modifier.padding(horizontal = 10.dp, vertical = 7.dp), color = color, fontWeight = FontWeight.Black) }
            Spacer(Modifier.width(11.dp))
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) { Text(challenge.options[option], Modifier.weight(1f), fontWeight = FontWeight.Bold, textAlign = TextAlign.Start) }
            if (selected != null && isAnswer) Icon(Icons.Rounded.CheckCircle, null, tint = QraytiColors.Success)
        }
    }
}

@Composable
private fun FeedbackCard(language: CodeLanguage, correct: Boolean, explanation: String, streak: Int, onNext: () -> Unit) {
    val tone = if (correct) QraytiColors.Success else Color(0xFFE74C5B)
    Surface(shape = RoundedCornerShape(25.dp), color = tone.copy(.12f), border = BorderStroke(1.dp, tone.copy(.24f))) {
        Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(9.dp)) {
            Text(if (correct) "Correct! +XP ${if (streak > 1) "• Streak ×$streak 🔥" else ""}" else "Not this one. Now you know why.", color = tone, fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
            Text(explanation, style = MaterialTheme.typography.bodyMedium)
            Button(onClick = onNext, Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = language.color)) { Icon(Icons.Rounded.PlayArrow, null); Spacer(Modifier.width(6.dp)); Text("Next mission") }
        }
    }
}

@Composable
private fun GameFinishCard(language: CodeLanguage, completedRun: Boolean, earned: Int, completed: Int, bestStreak: Int, onRetry: () -> Unit) {
    Card(shape = RoundedCornerShape(31.dp), colors = CardDefaults.cardColors(containerColor = language.color.copy(.12f)), border = BorderStroke(1.dp, language.color.copy(.24f))) {
        Column(Modifier.fillMaxWidth().padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(if (completedRun) "🏆" else "🛠️", fontSize = 64.sp)
            Text(if (completedRun) "World complete!" else "Try this world again", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, textAlign = TextAlign.Center)
            Text(if (completedRun) "${language.mascotName} says: You know the basics now." else "No hearts left. Read the help and beat the bugs next time.", textAlign = TextAlign.Center, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                QuestStat("⚡", "+$earned", "Round XP", language.color)
                QuestStat("✅", "$completed/${language.challenges.size}", "Done", QraytiColors.Success)
                QuestStat("🔥", "$bestStreak", "Best", Color(0xFFF28A2E))
            }
            Button(onClick = onRetry, Modifier.fillMaxWidth(), shape = RoundedCornerShape(17.dp), colors = androidx.compose.material3.ButtonDefaults.buttonColors(containerColor = language.color)) { Icon(Icons.Rounded.Refresh, null); Spacer(Modifier.width(7.dp)); Text(if (completedRun) "Play again" else "Start again") }
        }
    }
}

@Composable
private fun QuestStat(icon: String, value: String, label: String, color: Color) {
    Surface(shape = RoundedCornerShape(18.dp), color = MaterialTheme.colorScheme.surface) {
        Column(Modifier.widthIn(min = 76.dp).padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) { Text(icon); Text(value, color = color, fontWeight = FontWeight.Black); Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant) }
    }
}

fun codeLanguageForSubject(subjectId: String, subjectName: String): String? {
    val value = "$subjectId $subjectName".lowercase()
    return when {
        "java" in value -> "java"
        "python" in value -> "python"
        listOf("c++", "cpp", "programmation c", "algorithm", "algo").any { it in value } -> "c"
        else -> null
    }
}

@Composable
fun SubjectCodeQuestBanner(languageId: String, user: UserStore, onClick: () -> Unit) {
    val language = remember(languageId) { CodeQuestContent.byId(languageId) }
    val completed = user.codeQuestCompleted(language.id).size
    Surface(onClick = onClick, shape = RoundedCornerShape(25.dp), color = language.color.copy(.11f), border = BorderStroke(1.dp, language.color.copy(.24f))) {
        Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(language.mascot, fontSize = 38.sp); Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) { Text("Play and learn ${language.name}", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium); Text("${language.world} • $completed/${language.challenges.size} missions", color = language.color, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold) }
            FilledTonalButton(onClick = onClick, contentPadding = PaddingValues(horizontal = 11.dp, vertical = 7.dp)) { Icon(Icons.Rounded.PlayArrow, null, Modifier.size(18.dp)); Text(" Play") }
        }
    }
}
