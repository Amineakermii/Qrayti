package com.qrayti.informatiquebeta

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.GridItemSpan
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.itemsIndexed as gridItemsIndexed
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.InsertDriveFile
import androidx.compose.material.icons.automirrored.rounded.MenuBook
import androidx.compose.material.icons.automirrored.rounded.Sort
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.activity.compose.BackHandler
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import java.io.File
import kotlinx.coroutines.delay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.round
import kotlin.random.Random

private sealed interface AppRoute {
    data object Home: AppRoute
    data class Semester(val key: SemesterKey): AppRoute
    data class Subject(val key: SemesterKey,val subjectId:String): AppRoute
    data object Licences: AppRoute
    data object Search: AppRoute
    data object Saved: AppRoute
    data object Grades: AppRoute
    data object Profile: AppRoute
    data class Calculator(val key:SemesterKey):AppRoute
    data class LanguageTest(val lang:String):AppRoute
    data class CodeQuest(val language:String? = null):AppRoute
    data object Faq: AppRoute
}

private enum class SubjectSort(val label:String) {
    SMART("ترتيب ذكي"), FAVORITES("مفضّلتي أولاً"), FILES("أكثر ملفات"), NAME("أبجدي")
}
private enum class FileSort(val label:String) {
    SMART("الأنسب أولاً"), FAVORITES("المفضلة أولاً"), NAME("الاسم"), SIZE_DESC("الأكبر"), SIZE_ASC("الأخف"), SOURCE("الجامعة")
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QraytiApp(theme: AppTheme, onThemeChange: (AppTheme) -> Unit){
    val context=LocalContext.current
    val catalog=remember{CatalogRepository(context.applicationContext)}
    val user=remember{UserStore(context.applicationContext)}
    val downloads=remember{DownloadController(context.applicationContext)}
    val remote=remember{RemoteConfigRepository()}
    val updateRepository=remember{UpdateRepository()}
    val updateManager=remember{AppUpdateManager(context.applicationContext)}
    var onboardingDone by remember{mutableStateOf(user.onboardingComplete())}
    if(!onboardingDone){CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl){OnboardingScreen(user){onboardingDone=true}};return}
    val scope=rememberCoroutineScope()
    val stack=remember{mutableStateListOf<AppRoute>(AppRoute.Home)}
    var userRev by remember{mutableIntStateOf(0)}
    var snackbar by remember{mutableStateOf<String?>(null)}
    var availableUpdate by remember{mutableStateOf<AppUpdate?>(null)}
    var updateProgress by remember{mutableStateOf<Float?>(null)}
    var pendingInstall by remember{mutableStateOf<File?>(null)}
    var checkingUpdate by remember{mutableStateOf(false)}
    var showWelcome15 by remember{mutableStateOf(user.shouldShowWelcome15())}
    val current=stack.last()
    val isOnline by rememberIsOnline()
    BackHandler(enabled=stack.size>1){ stack.removeAt(stack.lastIndex) }
    val snackHost=remember{SnackbarHostState()}
    LaunchedEffect(snackbar){snackbar?.let{snackHost.showSnackbar(it);snackbar=null}}
    fun checkForUpdate(announce:Boolean) {
        if (checkingUpdate) return
        scope.launch {
            checkingUpdate = true
            updateRepository.check().fold(
                onSuccess = { update ->
                    user.markUpdateChecked()
                    if (update != null && (update.mandatory || !user.shouldDelayUpdate(update.versionCode))) availableUpdate = update
                    else if (announce) snackbar = "عندك آخر نسخة من قرايتي ✓"
                },
                onFailure = { if (announce) snackbar = "ما نجّمش نتثبّت من التحديث توا" },
            )
            checkingUpdate = false
        }
    }
    LaunchedEffect(isOnline) {
        if (isOnline && System.currentTimeMillis() - user.lastUpdateCheck() > 6 * 60 * 60 * 1_000L) checkForUpdate(false)
    }
    val lifecycleOwner=LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner,pendingInstall){
        val observer=LifecycleEventObserver{_,event->if(event==Lifecycle.Event.ON_RESUME){pendingInstall?.let{apk->if(updateManager.canInstallPackages()&&updateManager.install(apk))pendingInstall=null}}}
        lifecycleOwner.lifecycle.addObserver(observer);onDispose{lifecycleOwner.lifecycle.removeObserver(observer)}
    }

    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Rtl){
        Scaffold(
            topBar={Column {
                QraytiTopBar(current,canBack=stack.size>1,onBack={if(stack.size>1)stack.removeAt(stack.lastIndex)},onSearch={if(current!=AppRoute.Search)stack.add(AppRoute.Search)},onSaved={if(current!=AppRoute.Saved)stack.add(AppRoute.Saved)},onProfile={if(current!=AppRoute.Profile){stack.clear();stack.add(AppRoute.Profile)}})
                AnimatedVisibility(!isOnline) {
                    Surface(color = MaterialTheme.colorScheme.tertiaryContainer) {
                        Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 7.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Rounded.CloudOff, null, Modifier.size(17.dp)); Spacer(Modifier.width(7.dp))
                            Text("أنت أوفلاين — المحفوظ والكور المخزّن يبقاو يخدمو", style = MaterialTheme.typography.labelMedium)
                        }
                    }
                }
            }},
            bottomBar={if(current is AppRoute.Home || current is AppRoute.Licences || current is AppRoute.Search || current is AppRoute.Profile) BottomNav(current){r->stack.clear();stack.add(r)}},
            snackbarHost={SnackbarHost(snackHost)},
            containerColor=MaterialTheme.colorScheme.background
        ){padding->
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.TopCenter){
                Box(Modifier.fillMaxSize().widthIn(max = 920.dp)) {
                AnimatedContent(
                    targetState = current,
                    transitionSpec = {
                        (fadeIn(tween(220)) + slideInHorizontally(tween(260)) { it / 10 }) togetherWith
                            (fadeOut(tween(150)) + slideOutHorizontally(tween(200)) { -it / 14 })
                    },
                    label = "screen transition",
                ) { r -> when(r){
                    AppRoute.Home->HomeScreen(user,catalog,downloads,userRev,onLicences={stack.clear();stack.add(AppRoute.Licences)},onGrades={stack.add(AppRoute.Grades)},onCodeQuest={stack.add(AppRoute.CodeQuest())},onContinue={id->scope.launch{catalog.fileById(id)?.let{f->stack.add(AppRoute.Subject(SemesterKey(f.licence,f.year,f.semester,f.track),f.subjectId))}}})
                    AppRoute.Licences->LicencesScreen(user){stack.add(AppRoute.Semester(it))}
                    is AppRoute.Semester->SemesterScreen(r.key,catalog,user,userRev,onSubject={stack.add(AppRoute.Subject(r.key,it))},onCalculator={stack.add(AppRoute.Calculator(r.key))})
                    is AppRoute.Subject->SubjectScreen(r.key,r.subjectId,catalog,user,downloads,remote,userRev,onUserChanged={userRev++},onGame={stack.add(AppRoute.CodeQuest(it))},message={snackbar=it})
                    AppRoute.Search->SearchScreen(catalog,user,downloads,userRev,onUserChanged={userRev++},message={snackbar=it})
                    AppRoute.Saved->SavedScreen(catalog,user,downloads,userRev,onUserChanged={userRev++},message={snackbar=it})
                    AppRoute.Grades->CalculatorScreen(SemesterKey(user.selectedLicence,user.selectedYear,user.selectedSemester,user.selectedTrack),catalog,user,message={snackbar=it})
                    AppRoute.Profile->ProfileScreen(user,downloads,theme,onThemeChange,checkingUpdate,onEditProfile={user.resetOnboarding();onboardingDone=false},onCheckUpdate={checkForUpdate(true)},onCalculator={stack.add(AppRoute.Calculator(SemesterKey(user.selectedLicence,user.selectedYear,user.selectedSemester,user.selectedTrack)))},onEnglish={stack.add(AppRoute.LanguageTest("en"))},onFrench={stack.add(AppRoute.LanguageTest("fr"))},onFaq={stack.add(AppRoute.Faq)})
                    is AppRoute.Calculator->CalculatorScreen(r.key,catalog,user,message={snackbar=it})
                    is AppRoute.LanguageTest->LanguageTestScreen(r.lang)
                    is AppRoute.CodeQuest->if(r.language==null)CodeQuestHub(user){stack.add(AppRoute.CodeQuest(it))}else CodeQuestGame(r.language,user)
                    AppRoute.Faq->FaqScreen(remote)
                }}
                }
            }
        }
        availableUpdate?.let { update ->
            AppUpdateDialog(
                update = update,
                progress = updateProgress,
                onUpdate = {
                    if (updateProgress != null) return@AppUpdateDialog
                    scope.launch {
                        updateProgress = 0f
                        updateManager.download(update) { updateProgress = it }.fold(
                            onSuccess = { apk -> updateProgress = 1f;pendingInstall=apk;if(updateManager.install(apk))pendingInstall=null else snackbar="فعّل السماح بتثبيت التطبيقات وارجع لقرايتي" },
                            onFailure = { updateProgress = null; snackbar = "فشل تحميل التحديث. جرّب مرة أخرى" },
                        )
                    }
                },
                onLater = {
                    if (!update.mandatory) { user.skipUpdate(update.versionCode); availableUpdate = null }
                },
            )
        }
        if(showWelcome15)V15WelcomeDialog{
            user.markWelcome15Seen()
            showWelcome15=false
        }
    }
}

@Composable
private fun V15WelcomeDialog(onStart:()->Unit){
    AlertDialog(
        onDismissRequest={},
        icon={Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.height(150.dp),contentScale=ContentScale.Fit)},
        title={Text("قرايتي ولات تعرفك ✨",fontWeight=FontWeight.Black)},
        text={Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
            Text("مرحبا بيك في 1.5 — حسابك وجامعتك، إجازات أسهل، وtheme جديدة.")
            listOf(Icons.Rounded.School to "جامعات تونس وكليتك في حسابك",Icons.AutoMirrored.Rounded.MenuBook to "الإجازات تظهر خطوة بخطوة",Icons.Rounded.SystemUpdate to "تحديث تلقائي يصلّح التثبيت وحدو").forEach{(icon,label)->Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=CircleShape,color=MaterialTheme.colorScheme.primaryContainer){Icon(icon,null,Modifier.padding(7.dp).size(17.dp),tint=MaterialTheme.colorScheme.primary)};Spacer(Modifier.width(9.dp));Text(label,fontWeight=FontWeight.Bold)}}
        }},
        confirmButton={Button(onClick=onStart,shape=RoundedCornerShape(16.dp)){Text("يلا نبدأ")}},
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QraytiTopBar(route:AppRoute,canBack:Boolean,onBack:()->Unit,onSearch:()->Unit,onSaved:()->Unit,onProfile:()->Unit){
    TopAppBar(
        title={Row(verticalAlignment=Alignment.CenterVertically,horizontalArrangement=Arrangement.spacedBy(8.dp)){
            Image(painterResource(R.drawable.qrayti_mascot_v12),"تميمة قرايتي",Modifier.size(width=46.dp,height=52.dp),contentScale=ContentScale.Fit)
            Column{Text("قرايتي",fontWeight=FontWeight.Black);Text("نراجعو شوية؟",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.primary,fontWeight=FontWeight.Bold)}
        }},
        navigationIcon={if(canBack) IconButton(onClick=onBack){Icon(Icons.AutoMirrored.Rounded.ArrowBack,"رجوع")} else {}},
        actions={
            if(route !is AppRoute.Search) IconButton(onClick=onSearch){Icon(Icons.Rounded.Search,"بحث")}
            if(route !is AppRoute.Saved) IconButton(onClick=onSaved){Icon(Icons.Rounded.Star,"المحفوظات")}
            if(route !is AppRoute.Profile) IconButton(onClick=onProfile){Icon(Icons.Rounded.AccountCircle,"حسابي")}
        }
    )
}

@Composable
private fun BottomNav(current:AppRoute,onRoute:(AppRoute)->Unit){
    Box(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal=12.dp,vertical=8.dp)){
    Surface(tonalElevation=10.dp,shadowElevation=18.dp,color=MaterialTheme.colorScheme.surface,shape=RoundedCornerShape(30.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outline.copy(.12f))){
      Row(Modifier.fillMaxWidth().padding(horizontal=8.dp,vertical=7.dp),horizontalArrangement=Arrangement.SpaceAround){
        listOf(
            Triple(AppRoute.Home,Icons.Rounded.Home,"الرئيسية"),
            Triple(AppRoute.Licences,Icons.AutoMirrored.Rounded.MenuBook,"الإجازات"),
            Triple(AppRoute.Search,Icons.Rounded.Search,"البحث"),
            Triple(AppRoute.Profile,Icons.Rounded.Person,"حسابي")
        ).forEach{(r,i,l)->
            val selected=current::class==r::class
            val scale by animateFloatAsState(if(selected)1.12f else 1f,spring(dampingRatio=.55f,stiffness=Spring.StiffnessMedium),label="nav bounce")
            val color by animateColorAsState(if(selected)MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant,label="nav color")
            Surface(onClick={onRoute(r)},shape=RoundedCornerShape(20.dp),color=if(selected)MaterialTheme.colorScheme.primaryContainer else Color.Transparent,modifier=Modifier.weight(1f)){
                Column(Modifier.padding(vertical=8.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(3.dp)){
                    Icon(i,l,Modifier.size(22.dp).graphicsLayer{scaleX=scale;scaleY=scale},tint=color)
                    AnimatedContent(selected,label="nav label"){active->Text(l,style=MaterialTheme.typography.labelSmall,fontWeight=if(active)FontWeight.Black else FontWeight.Medium,color=color)}
                }
            }
        }
      }
    }
    }
}

@Composable
private fun AppUpdateDialog(update:AppUpdate,progress:Float?,onUpdate:()->Unit,onLater:()->Unit){
    AlertDialog(
        onDismissRequest = { if (!update.mandatory && progress == null) onLater() },
        icon = { Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.height(86.dp),contentScale=ContentScale.Fit) },
        title = { Text("قرايتي ${update.versionName} وصلت ✨", fontWeight = FontWeight.Black) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("تحديث أخف وأسرع. التطبيق يحمّلو ويتثبت بموافقتك.")
                update.notes.forEach { note ->
                    Row(verticalAlignment = Alignment.Top) {
                        Text("•", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
                        Spacer(Modifier.width(8.dp)); Text(note, style = MaterialTheme.typography.bodyMedium)
                    }
                }
                if (update.size > 0) Text("الحجم: ${formatBytes(update.size)}", style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                progress?.let {
                    LinearProgressIndicator(progress = { it }, Modifier.fillMaxWidth())
                    Text(if (it >= 1f) "جاهز للتثبيت" else "نحمّل… ${(it * 100).toInt()}%", style = MaterialTheme.typography.labelMedium)
                }
            }
        },
        confirmButton = { Button(onClick = onUpdate, enabled = progress == null) { Text(if (progress == null) "حدّث توا" else "نحمّل…") } },
        dismissButton = { if (!update.mandatory && progress == null) TextButton(onClick = onLater) { Text("بعد") } },
    )
}

@Composable
private fun HomeScreen(user:UserStore,catalog:CatalogRepository,downloads:DownloadController,userRev:Int,onLicences:()->Unit,onGrades:()->Unit,onCodeQuest:()->Unit,onContinue:(String)->Unit){
    val all by produceState<List<CourseFile>?>(initialValue=null){value=catalog.allStatic()}
    val recentFiles=remember(all,userRev){val byId=all.orEmpty().associateBy{it.id};user.recent().mapNotNull(byId::get).take(5)}
    val last=user.lastFile()?.let { id -> all?.firstOrNull { it.id==id } }
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(horizontal=16.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(18.dp)){
        item{HeroCard(user.profileName,all?.size ?: 0,onGrades)}
        item {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                DashboardAction("معدّلي","احسب توا",Icons.Rounded.Calculate,QraytiColors.ElectricBlue,Modifier.weight(1.3f),onGrades)
                DashboardStat("${user.favorites().size}","محفوظ",Icons.Rounded.Star,QraytiColors.Gold,Modifier.weight(1f))
                DashboardStat("${downloads.downloadedCount()}","أوفلاين",Icons.Rounded.DownloadDone,QraytiColors.Success,Modifier.weight(1f))
            }
        }
        item { CodeQuestHomeBanner(user,onCodeQuest) }
        if(last!=null || recentFiles.isNotEmpty()){
            item{SectionTitle("كمّل قرايتك","ارجع للكور من غير ما تعاود تلوّج")}
            item{
                LazyRow(horizontalArrangement=Arrangement.spacedBy(10.dp),contentPadding=PaddingValues(end=2.dp)){
                    val shown=if(recentFiles.isNotEmpty())recentFiles else listOfNotNull(last)
                    items(shown,key={it.id}){f->ContinueCard(f){onContinue(f.id)}}
                }
            }
        }
        item{LicenceDiscoveryBanner(onLicences)}
        item{SectionTitle("جامعات تونس معانا","مصادر من جامعات ومعاهد تونسية باش تلقى كورك مرتاح")}
        item{UniversityReassurance(user.universityId)}
        item{HelpEmailCard()}
        item{
            MascotTipCard("كل شيء في بلاصتو","الكور حسب السداسي، الملفات المهمة في المحفوظ، والمعدّل يتبدّل وحدو كل ما تعمّر مادة.")
        }
        item{Spacer(Modifier.height(70.dp))}
    }
}

@Composable private fun HeroCard(name:String,fileCount:Int,onGrades:()->Unit){
    val motion=rememberInfiniteTransition(label="mascot motion")
    val floatY by motion.animateFloat(-5f,5f,infiniteRepeatable(tween(2300,easing=FastOutSlowInEasing),RepeatMode.Reverse),label="mascot float")
    val greeting=(if(java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY)<17)"نهارك مبروك" else "عسلامة")+(if(name.isNotBlank())"، $name 👋" else " 👋")
    Card(shape=RoundedCornerShape(30.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.primaryContainer)){
        Box(Modifier.fillMaxWidth().height(198.dp).background(Brush.linearGradient(listOf(MaterialTheme.colorScheme.primaryContainer,MaterialTheme.colorScheme.secondaryContainer.copy(.72f))))){
            Box(Modifier.size(150.dp).align(Alignment.BottomEnd).background(Color.White.copy(.34f),CircleShape))
            Box(Modifier.size(76.dp).align(Alignment.TopStart).offset((-18).dp,(-24).dp).background(QraytiColors.Violet.copy(.10f),CircleShape))
            Image(
                painter=painterResource(R.drawable.qrayti_mascot_v12),
                contentDescription="تميمة قرايتي",
                modifier=Modifier.align(Alignment.BottomEnd).height(176.dp).width(136.dp).graphicsLayer{translationY=floatY},
                contentScale=ContentScale.Fit,
            )
            Column(Modifier.align(Alignment.CenterStart).fillMaxWidth(.68f).padding(18.dp),verticalArrangement=Arrangement.spacedBy(7.dp)){
                Text(greeting,color=MaterialTheme.colorScheme.primary,fontWeight=FontWeight.Black,style=MaterialTheme.typography.labelLarge)
                Text("شنوّة باش نراجعو اليوم؟",style=MaterialTheme.typography.headlineSmall,fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.onPrimaryContainer)
                Text(if(fileCount>0)"${formatCount(fileCount)} ملف مستنّيك" else "الكور الكل في بلاصة واحدة",color=MaterialTheme.colorScheme.onPrimaryContainer.copy(.66f),style=MaterialTheme.typography.bodyMedium)
                FilledTonalButton(onClick=onGrades,shape=RoundedCornerShape(14.dp),contentPadding=PaddingValues(horizontal=13.dp,vertical=8.dp)){
                    Icon(Icons.Rounded.Calculate,null,Modifier.size(18.dp));Spacer(Modifier.width(6.dp));Text("احسب معدّلي")
                }
            }
        }
    }
}

@Composable private fun DashboardStat(value:String,label:String,icon:androidx.compose.ui.graphics.vector.ImageVector,tone:Color,modifier:Modifier=Modifier){
    Surface(modifier=modifier.height(94.dp),shape=RoundedCornerShape(22.dp),color=tone.copy(.10f),border=BorderStroke(1.dp,tone.copy(.12f))){
        Column(Modifier.padding(11.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(3.dp)){
            Icon(icon,null,tint=tone,modifier=Modifier.size(20.dp));Text(value,fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium);Text(label,style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)
        }
    }
}
@Composable private fun DashboardAction(title:String,sub:String,icon:androidx.compose.ui.graphics.vector.ImageVector,tone:Color,modifier:Modifier=Modifier,onClick:()->Unit){
    Surface(onClick=onClick,modifier=modifier.height(94.dp),shape=RoundedCornerShape(22.dp),color=tone){Column(Modifier.padding(12.dp),verticalArrangement=Arrangement.spacedBy(4.dp)){Icon(icon,null,tint=Color.White,modifier=Modifier.size(21.dp));Text(title,color=Color.White,fontWeight=FontWeight.Black);Text(sub,color=Color.White.copy(.76f),style=MaterialTheme.typography.labelSmall)}}
}

@Composable private fun ContinueCard(f:CourseFile,onClick:()->Unit){
    val tone=subjectTone(f.subjectName)
    Card(onClick=onClick,modifier=Modifier.width(244.dp),shape=RoundedCornerShape(23.dp),border=BorderStroke(1.dp,tone.copy(.13f))){Column(Modifier.padding(13.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){
        Row(verticalAlignment=Alignment.CenterVertically){Image(painterResource(subjectArtworkRes(f.subjectId,f.subjectName)),null,Modifier.size(48.dp).clip(RoundedCornerShape(14.dp)),contentScale=ContentScale.Crop);Spacer(Modifier.width(9.dp));Column(Modifier.weight(1f)){Text(f.subjectName,fontWeight=FontWeight.Black,maxLines=1,overflow=TextOverflow.Ellipsis);Text("S${f.semester} • ${contentCategoryTitle(f.category)}",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Rounded.PlayArrow,null,tint=tone)}
        Text(f.displayName,maxLines=2,minLines=2,overflow=TextOverflow.Ellipsis,style=MaterialTheme.typography.bodySmall)
        LinearProgressIndicator(progress={.72f},modifier=Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),color=tone,trackColor=tone.copy(.10f))
    }}
}

private fun licenceTone(licence:String)=when(licence){"lce"->QraytiColors.Success;"lt"->QraytiColors.Gold;else->QraytiColors.ElectricBlue}
private fun licenceIcon(licence:String)=when(licence){"lce"->Icons.Rounded.Memory;"lt"->Icons.Rounded.CellTower;else->Icons.Rounded.Code}

@Composable private fun LicenceDiscoveryBanner(onClick:()->Unit){
    Surface(onClick=onClick,shape=RoundedCornerShape(27.dp),color=MaterialTheme.colorScheme.secondaryContainer,border=BorderStroke(1.dp,MaterialTheme.colorScheme.secondary.copy(.12f))){
        Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(18.dp),color=MaterialTheme.colorScheme.secondary){Icon(Icons.AutoMirrored.Rounded.MenuBook,null,Modifier.padding(13.dp).size(25.dp),tint=Color.White)};Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text("اكتشف الإجازات",fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text("اختار إجازتك، وبعدها السنة والسداسي بسهولة",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSecondaryContainer.copy(.68f))};Icon(Icons.Rounded.ChevronLeft,null,tint=MaterialTheme.colorScheme.secondary)}
    }
}

@Composable private fun UniversityReassurance(selectedId:String){
    val selected=TunisianUniversities.byId(selectedId)
    val shown=listOfNotNull(selected)+TunisianUniversities.all.filter{it.id!=selectedId}.take(5)
    LazyRow(horizontalArrangement=Arrangement.spacedBy(9.dp)){items(shown,key={it.id}){uni->Surface(shape=RoundedCornerShape(20.dp),color=if(uni.id==selectedId)uni.color.copy(.12f) else MaterialTheme.colorScheme.surface,border=BorderStroke(1.dp,uni.color.copy(.16f))){Row(Modifier.padding(10.dp),verticalAlignment=Alignment.CenterVertically){UniversityBadge(uni,Modifier.sizeIn(minWidth=52.dp,minHeight=46.dp));Spacer(Modifier.width(8.dp));Column(Modifier.widthIn(max=120.dp)){Text(uni.name,fontWeight=FontWeight.Bold,maxLines=1,overflow=TextOverflow.Ellipsis);Text(if(uni.id==selectedId)"جامعتك ✓" else uni.city,style=MaterialTheme.typography.labelSmall,color=uni.color)}}}}}
}

@Composable private fun HelpEmailCard(){
    val context=LocalContext.current
    Surface(onClick={context.startActivity(Intent(Intent.ACTION_SENDTO,Uri.parse("mailto:9rayti.learn@gmail.com?subject=مساعدة من تطبيق قرايتي")))},shape=RoundedCornerShape(22.dp),color=MaterialTheme.colorScheme.tertiaryContainer.copy(.55f)){Row(Modifier.fillMaxWidth().padding(14.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.MarkEmailUnread,null,tint=MaterialTheme.colorScheme.tertiary);Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text("كورك موش موجود؟ نحنا نعاونوك",fontWeight=FontWeight.Black);Text("9rayti.learn@gmail.com",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.tertiary)};Icon(Icons.Rounded.OpenInNew,null,Modifier.size(18.dp))}}
}

@Composable private fun LicencesScreen(user:UserStore,onOpenSemester:(SemesterKey)->Unit){
    var expanded by remember{mutableStateOf<String?>(null)}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(horizontal=16.dp,vertical=12.dp),verticalArrangement=Arrangement.spacedBy(13.dp)){
        item{SectionTitle("إجازتك، خطوة بخطوة","اضغط على الإجازة أولاً؛ السنوات والسداسيات يظهروا بعد بالتدريج")}
        itemsIndexed(listOf("info","lce","lt"),key={_,it->it}){index,licence->
            var visible by remember(licence){mutableStateOf(false)}
            LaunchedEffect(licence){delay((index*110).toLong());visible=true}
            AnimatedVisibility(visible,enter=fadeIn(tween(320))+slideInVertically(tween(380)){it/3}){
                val tone=licenceTone(licence)
                val open=expanded==licence
                Surface(onClick={expanded=if(open)null else licence},modifier=Modifier.fillMaxWidth().animateContentSize(),shape=RoundedCornerShape(29.dp),color=tone.copy(if(open).13f else .08f),border=BorderStroke(1.dp,tone.copy(if(open).36f else .14f))){
                    Column(Modifier.fillMaxWidth().padding(17.dp),verticalArrangement=Arrangement.spacedBy(13.dp)){
                        Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(19.dp),color=tone){Icon(licenceIcon(licence),null,Modifier.padding(14.dp).size(28.dp),tint=Color.White)};Spacer(Modifier.width(13.dp));Column(Modifier.weight(1f)){Text(ProgrammeNames.licenceName(licence),fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text(ProgrammeNames.licenceArabic(licence),color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(if(open)Icons.Rounded.KeyboardArrowUp else Icons.Rounded.ChevronLeft,null,tint=tone)}
                        AnimatedVisibility(open,enter=fadeIn(tween(250))+expandVertically(),exit=fadeOut()+shrinkVertically()){
                            Column(verticalArrangement=Arrangement.spacedBy(11.dp)){
                                HorizontalDivider(color=tone.copy(.14f))
                                Text("اختار السنة",fontWeight=FontWeight.Black,color=tone)
                                val years=if(licence=="info")listOf(1,2)else listOf(1)
                                years.forEach{year->
                                    Surface(shape=RoundedCornerShape(20.dp),color=MaterialTheme.colorScheme.surface){
                                        Column(Modifier.padding(12.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){
                                            Row(verticalAlignment=Alignment.CenterVertically){
                                                Surface(shape=CircleShape,color=tone.copy(.12f)){Text("Y$year",Modifier.padding(9.dp),color=tone,fontWeight=FontWeight.Black)}
                                                Spacer(Modifier.width(8.dp));Text(if(year==1)"السنة الأولى" else "السنة الثانية",fontWeight=FontWeight.Black)
                                            }
                                            Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                                                listOf(1,2).forEach{semester->
                                                    FilledTonalButton(onClick={
                                                        val track=if(licence=="info"&&year==2)"genie" else "common"
                                                        user.selectedLicence=licence;user.selectedYear=year;user.selectedSemester=semester;user.selectedTrack=track
                                                        onOpenSemester(SemesterKey(licence,year,semester,track))
                                                    },modifier=Modifier.weight(1f),shape=RoundedCornerShape(15.dp)){
                                                        Text("السداسي $semester",fontWeight=FontWeight.Bold);Spacer(Modifier.width(5.dp));Icon(Icons.Rounded.ArrowOutward,null,Modifier.size(16.dp))
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        item{Spacer(Modifier.height(70.dp))}
    }
}

private fun formatCount(value:Int):String = String.format(java.util.Locale.US, "%,d", value)
private fun formatBytes(value:Long):String = when {
    value >= 1024L * 1024 * 1024 -> String.format(java.util.Locale.US, "%.1f GB", value / (1024.0 * 1024 * 1024))
    value >= 1024L * 1024 -> String.format(java.util.Locale.US, "%.1f MB", value / (1024.0 * 1024))
    value >= 1024L -> String.format(java.util.Locale.US, "%.1f KB", value / 1024.0)
    else -> "$value B"
}

@Composable private fun SectionTitle(title:String,sub:String?=null){Column{Text(title,style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Black);if(sub!=null)Text(sub,style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)}}
@Composable private fun NoticeCard(title:String,text:String){Card(colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.tertiaryContainer.copy(.4f))){Row(Modifier.fillMaxWidth().padding(14.dp)){Icon(Icons.Rounded.Info,null);Spacer(Modifier.width(10.dp));Column{Text(title,fontWeight=FontWeight.Bold);Text(text,style=MaterialTheme.typography.bodySmall)}}}}

@Composable
private fun SemesterScreen(key:SemesterKey,catalog:CatalogRepository,user:UserStore,userRev:Int,onSubject:(String)->Unit,onCalculator:()->Unit){
    var refreshToken by remember(key) { mutableIntStateOf(0) }
    var sort by remember(key) { mutableStateOf(SubjectSort.SMART) }
    var sortOpen by remember { mutableStateOf(false) }
    var query by remember(key){mutableStateOf("")}
    val files by produceState<List<CourseFile>?>(initialValue=null,key,refreshToken){value=catalog.semesterFiles(key, refresh = refreshToken > 0)}
    val subjects=remember(files){files?.let{catalog.subjects(it)}?:emptyList()}
    val favoriteIds=remember(userRev){user.favorites()}
    val favoriteCounts=remember(files,favoriteIds){files.orEmpty().filter{it.id in favoriteIds}.groupingBy{it.subjectId}.eachCount()}
    val orderedSubjects=remember(subjects,sort,query,favoriteCounts){
        val filtered=subjects.filter{query.isBlank()||CatalogRepository.normalize(it.name).contains(CatalogRepository.normalize(query))}
        when(sort){
            SubjectSort.SMART->filtered.sortedWith(compareBy<SubjectSummary>{subjectRank(it.name)}.thenBy{CatalogRepository.normalize(it.name)})
            SubjectSort.FAVORITES->filtered.sortedWith(compareByDescending<SubjectSummary>{favoriteCounts[it.id]?:0}.thenBy{CatalogRepository.normalize(it.name)})
            SubjectSort.FILES->filtered.sortedByDescending{it.count}
            SubjectSort.NAME->filtered.sortedBy{CatalogRepository.normalize(it.name)}
        }
    }
    val maxCount=subjects.maxOfOrNull{it.count}?.coerceAtLeast(1)?:1
    LazyVerticalGrid(columns=GridCells.Adaptive(170.dp),modifier=Modifier.fillMaxSize(),contentPadding=PaddingValues(16.dp),horizontalArrangement=Arrangement.spacedBy(11.dp),verticalArrangement=Arrangement.spacedBy(11.dp)){
        item(span={GridItemSpan(maxLineSpan)}){
            Surface(shape=RoundedCornerShape(27.dp),color=MaterialTheme.colorScheme.primaryContainer,border=BorderStroke(1.dp,MaterialTheme.colorScheme.primary.copy(.10f))){
                Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){
                    Surface(shape=RoundedCornerShape(18.dp),color=MaterialTheme.colorScheme.primary){Icon(Icons.AutoMirrored.Rounded.MenuBook,null,Modifier.padding(13.dp).size(26.dp),tint=Color.White)}
                    Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text("كور S${key.semester}",style=MaterialTheme.typography.titleLarge,fontWeight=FontWeight.Black);Text("${ProgrammeNames.licenceName(key.licence)} • سنة ${key.year}",style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onPrimaryContainer.copy(.68f));Text("${subjects.size} مادة • ${files?.size?:0} ملف",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary,fontWeight=FontWeight.Bold)}
                    IconButton(onClick={refreshToken++}){Icon(Icons.Rounded.Refresh,"تحديث الكور")}
                }
            }
        }
        item(span={GridItemSpan(maxLineSpan)}){
            OutlinedTextField(value=query,onValueChange={query=it},modifier=Modifier.fillMaxWidth(),singleLine=true,placeholder={Text("لوّج في مواد السداسي")},leadingIcon={Icon(Icons.Rounded.Search,null)},trailingIcon=if(query.isNotBlank()){{IconButton({query=""}){Icon(Icons.Rounded.Close,"امسح")}}}else null,shape=RoundedCornerShape(20.dp))
        }
        item(span={GridItemSpan(maxLineSpan)}){Row(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){
            FilledTonalButton(onClick=onCalculator,modifier=Modifier.weight(1f)){Icon(Icons.Rounded.Calculate,null);Spacer(Modifier.width(7.dp));Text("حاسبة السداسي")}
            Box {
                OutlinedButton(onClick={sortOpen=true}){Icon(Icons.AutoMirrored.Rounded.Sort,null);Spacer(Modifier.width(6.dp));Text(sort.label)}
                DropdownMenu(sortOpen,{sortOpen=false}){SubjectSort.entries.forEach{option->DropdownMenuItem({Text(option.label)},{sort=option;sortOpen=false})}}
            }
        }}
        item(span={GridItemSpan(maxLineSpan)}){Row(verticalAlignment=Alignment.CenterVertically){Text("${orderedSubjects.size} مادة",fontWeight=FontWeight.Black,modifier=Modifier.weight(1f));Text("${files?.size?:0} ملف",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)}}
        if(files==null){item(span={GridItemSpan(maxLineSpan)}){LoadingBlock()}} else if(orderedSubjects.isEmpty()){item(span={GridItemSpan(maxLineSpan)}){EmptyBlock(if(query.isBlank())"ما لقيناش مواد في هذا السداسي." else "ما لقيناش مادة بالاسم هذا.")}} else gridItemsIndexed(orderedSubjects,key={_,it->it.id}){index,s->SubjectCard(s,index,favoriteCounts[s.id]?:0,maxCount){onSubject(s.id)}}
        item(span={GridItemSpan(maxLineSpan)}){Spacer(Modifier.height(40.dp))}
    }
}

@Composable private fun SubjectCard(s:SubjectSummary,index:Int,favoriteFiles:Int,maxCount:Int,onClick:()->Unit){
    var visible by remember(s.id){mutableStateOf(false)}
    LaunchedEffect(s.id){delay((index.coerceAtMost(7)*45).toLong());visible=true}
    AnimatedVisibility(visible,enter=fadeIn(tween(260))+slideInVertically(tween(300)){it/4}){
      Card(onClick=onClick,modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(23.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outline.copy(.09f))){
        Column(Modifier.fillMaxWidth().padding(12.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){
          val tone=subjectTone(s.name)
          SubjectArtwork(s,Modifier.fillMaxWidth().height(104.dp))
          Text(s.name,fontWeight=FontWeight.Black,maxLines=2,minLines=2,overflow=TextOverflow.Ellipsis)
          Row(verticalAlignment=Alignment.CenterVertically){Text("${s.count} ملف",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant,modifier=Modifier.weight(1f));if(favoriteFiles>0){Icon(Icons.Rounded.Star,null,Modifier.size(14.dp),tint=QraytiColors.Gold);Spacer(Modifier.width(3.dp));Text("$favoriteFiles",style=MaterialTheme.typography.labelMedium)};Surface(shape=CircleShape,color=tone.copy(.12f)){Icon(Icons.Rounded.ArrowOutward,null,Modifier.padding(6.dp).size(16.dp),tint=tone)}}
          LinearProgressIndicator(progress={s.count.toFloat()/maxCount},modifier=Modifier.fillMaxWidth().height(5.dp).clip(CircleShape),color=tone,trackColor=tone.copy(.10f))
        }
      }
    }
}

private fun subjectArtworkRes(name:String):Int{
    val n=CatalogRepository.normalize(name)
    return when{
        listOf("base","donnee","database","sql","information").any{it in n}->R.drawable.subject_art_database
        listOf("reseau","network","telecom","signal","transmission").any{it in n}->R.drawable.subject_art_networks
        listOf("math","analyse","algebre","probabil","stat","graphe","logique").any{it in n}->R.drawable.subject_art_math
        listOf("electron","electri","circuit","microproces","architecture","automate").any{it in n}->R.drawable.subject_art_electronics
        listOf("web","design","multimedia","infograph","interface").any{it in n}->R.drawable.subject_art_web_design
        listOf("anglais","english","francais","language","langue","communication").any{it in n}->R.drawable.subject_art_languages
        listOf("algorithm","programm","java","python","c++","develop","code").any{it in n}->R.drawable.subject_art_programming
        else->R.drawable.subject_art_general
    }
}
private fun subjectArtworkRes(subjectId:String?,name:String):Int = subjectId?.let(::subjectArtworkResForId) ?: subjectArtworkRes(name)
@Composable private fun SubjectArtwork(s:SubjectSummary,modifier:Modifier=Modifier){
    val tone=subjectTone(s.name)
    val motion=rememberInfiniteTransition(label="subject artwork")
    val scale by motion.animateFloat(1.01f,1.055f,infiniteRepeatable(tween(5200,easing=FastOutSlowInEasing),RepeatMode.Reverse),label="art breathe")
    Box(modifier.clip(RoundedCornerShape(18.dp))){
        Image(
            painter=painterResource(subjectArtworkRes(s.id,s.name)),
            contentDescription="رسم ${s.name}",
            modifier=Modifier.fillMaxSize().graphicsLayer{scaleX=scale;scaleY=scale},
            contentScale=ContentScale.Crop,
        )
        Box(Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Color.Transparent,Color.Black.copy(.12f)))))
        Surface(Modifier.align(Alignment.TopEnd).padding(7.dp),shape=CircleShape,color=MaterialTheme.colorScheme.surface.copy(.86f)){Text("${s.count}",Modifier.padding(horizontal=8.dp,vertical=4.dp),color=tone,style=MaterialTheme.typography.labelSmall,fontWeight=FontWeight.Black)}
    }
}
private fun subjectRank(name:String):Int{val n=CatalogRepository.normalize(name);return when{listOf("algorithm","programm","java","python","c++","web").any{it in n}->0;listOf("base","donnee","system","reseau","architecture").any{it in n}->1;listOf("math","analyse","algebre","probabil","stat").any{it in n}->2;listOf("anglais","francais","communication").any{it in n}->4;else->3}}
private fun subjectTone(name:String):Color=when(subjectRank(name)){0->QraytiColors.ElectricBlue;1->QraytiColors.Cyan;2->QraytiColors.Violet;4->QraytiColors.Gold;else->QraytiColors.Success}

@Composable
private fun SubjectScreen(key:SemesterKey,subjectId:String,catalog:CatalogRepository,user:UserStore,downloads:DownloadController,remote:RemoteConfigRepository,userRev:Int,onUserChanged:()->Unit,onGame:(String)->Unit,message:(String)->Unit){
    val context=LocalContext.current
    var refreshToken by remember(key,subjectId){mutableIntStateOf(0)}
    val files by produceState<List<CourseFile>?>(initialValue=null,key,subjectId,refreshToken){value=catalog.semesterFiles(key,refresh=refreshToken>0).filter{it.subjectId==subjectId}}
    val fav=user.favorites()
    var category by remember(subjectId){mutableStateOf<String?>(null)}
    var favoritesOnly by remember{mutableStateOf(false)}
    var sort by remember{mutableStateOf(FileSort.SMART)}
    var sortOpen by remember{mutableStateOf(false)}
    val categories=files.orEmpty().groupingBy{it.category}.eachCount().entries.sortedWith(compareBy({contentCategoryOrder(it.key)},{contentCategoryTitle(it.key)}))
    val filtered=if(category==null)emptyList() else files.orEmpty().filter{it.category==category&&(!favoritesOnly||it.id in fav)}
    val visible=remember(filtered,sort){when(sort){
        FileSort.SMART->filtered.sortedWith(compareByDescending<CourseFile>{it.id in fav}.thenBy{CatalogRepository.normalize(it.group)}.thenBy{CatalogRepository.normalize(it.displayName)})
        FileSort.FAVORITES->filtered.sortedWith(compareByDescending<CourseFile>{it.id in fav}.thenBy{CatalogRepository.normalize(it.displayName)})
        FileSort.NAME->filtered.sortedBy{CatalogRepository.normalize(it.displayName)}
        FileSort.SIZE_DESC->filtered.sortedByDescending{it.size}
        FileSort.SIZE_ASC->filtered.sortedBy{it.size}
        FileSort.SOURCE->filtered.sortedWith(compareBy<CourseFile>{CatalogRepository.normalize(it.sourceUniversity)}.thenBy{CatalogRepository.normalize(it.displayName)})
    }}
    val groups=if(sort==FileSort.SMART)visible.groupBy{it.group.ifBlank{contentCategoryTitle(category.orEmpty())}}else linkedMapOf(sort.label to visible)
    var mascot by remember{mutableStateOf<Pair<String,MascotScenario>?>(null)}
    LaunchedEffect(subjectId){
        delay(Random.nextLong(18000,42000));val (name,sc)=remote.mascot();if(sc.isNotEmpty()) mascot=name to weightedRandom(sc)
    }
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(14.dp),verticalArrangement=Arrangement.spacedBy(10.dp)){
        item{Row(verticalAlignment=Alignment.CenterVertically){Box(Modifier.weight(1f)){SectionTitle(files?.firstOrNull()?.subjectName?:"المادة",if(category==null)"اختار شنوّة تحب قبل ما نعرضولك الملفات" else "${visible.size} ${contentCategoryTitle(category.orEmpty())}")};IconButton({refreshToken++}){Icon(Icons.Rounded.Refresh,"حدّث المادة")}}}
        codeLanguageForSubject(subjectId,files?.firstOrNull()?.subjectName.orEmpty())?.let { language -> item { SubjectCodeQuestBanner(language,user){onGame(language)} } }
        if(files==null)item{LoadingBlock()}
        else if(category==null){
            item{Surface(shape=RoundedCornerShape(27.dp),color=MaterialTheme.colorScheme.primaryContainer.copy(.62f)){Column(Modifier.fillMaxWidth().padding(17.dp),verticalArrangement=Arrangement.spacedBy(5.dp)){Text("شنوّة تحب تراجع؟",fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text("اختار قسم واحد، وبعدها نوريولك كان المحتوى اللي طلبتو.",color=MaterialTheme.colorScheme.onPrimaryContainer.copy(.70f),style=MaterialTheme.typography.bodyMedium)}}}
            items(categories,key={it.key}){entry->ContentCategoryCard(entry.key,entry.value){category=entry.key;favoritesOnly=false;sort=FileSort.SMART}}
        } else {
            item{Surface(shape=RoundedCornerShape(22.dp),color=MaterialTheme.colorScheme.secondaryContainer.copy(.62f)){Row(Modifier.fillMaxWidth().padding(13.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(15.dp),color=MaterialTheme.colorScheme.secondary){Icon(contentCategoryIcon(category.orEmpty()),null,Modifier.padding(10.dp).size(22.dp),tint=Color.White)};Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(contentCategoryTitle(category.orEmpty()),fontWeight=FontWeight.Black);Text("${filtered.size} ملف",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSecondaryContainer.copy(.68f))};TextButton({category=null}){Text("بدّل الاختيار")}}}}
            item{Row(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){
                Box { OutlinedButton({sortOpen=true}){Icon(Icons.AutoMirrored.Rounded.Sort,null);Spacer(Modifier.width(6.dp));Text(sort.label)};DropdownMenu(sortOpen,{sortOpen=false}){FileSort.entries.forEach{option->DropdownMenuItem({Text(option.label)},{sort=option;sortOpen=false})}} }
                FilterChip(favoritesOnly,{favoritesOnly=!favoritesOnly},{Text("المفضلة")},leadingIcon={Icon(if(favoritesOnly)Icons.Rounded.Star else Icons.Rounded.StarBorder,null,Modifier.size(18.dp))})
            }}
            groups.forEach{(group,gfiles)->
            item(key="g_$group"){Text(group,fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium,modifier=Modifier.padding(top=8.dp))}
            items(gfiles,key={it.id}){f->FileCard(f,f.id in fav,downloads,onFavorite={user.toggleFavorite(f.id);onUserChanged()},onRead={
                user.markRecent(f.id);user.setLastFile(f.id);onUserChanged()
                val local=downloads.localFile(f).takeIf{downloads.isDownloaded(f)}
                if(local!=null) FileActions.open(context,f,local)
                else {downloads.enqueue(f);message("نحمّل فيه… يفتح وحده كي يكمل")}
            },onDownload={if(downloads.isDownloaded(f)){downloads.remove(f);message("تم حذف النسخة المحمّلة") } else {downloads.enqueue(f);message("بدا التحميل")}},onShare={FileActions.share(context,f)})}
            }
        }
        item{Spacer(Modifier.height(70.dp))}
    }
    mascot?.let{(name,scenario)->MascotDialog(name,scenario,onDismiss={mascot=null})}
}

private fun contentCategoryOrder(category:String)=listOf("cours","resume","td","tp","exam","qcm","program","extra").indexOf(category).let{if(it<0)99 else it}
private fun contentCategoryTitle(category:String)=when(category){"cours"->"الكور";"resume"->"الملخّصات";"td"->"تمارين TD";"tp"->"تطبيقات TP";"exam"->"الامتحانات وDS";"qcm"->"أسئلة QCM";"program"->"البرنامج والمراجع";else->"موارد أخرى"}
private fun contentCategoryIcon(category:String)=when(category){"cours"->Icons.AutoMirrored.Rounded.MenuBook;"resume"->Icons.Rounded.Summarize;"td"->Icons.Rounded.EditNote;"tp"->Icons.Rounded.Science;"exam"->Icons.Rounded.Assignment;"qcm"->Icons.Rounded.Quiz;"program"->Icons.Rounded.Map;else->Icons.Rounded.Folder}
@Composable private fun ContentCategoryCard(category:String,count:Int,onClick:()->Unit){
    Surface(onClick=onClick,shape=RoundedCornerShape(23.dp),color=MaterialTheme.colorScheme.surface,border=BorderStroke(1.dp,MaterialTheme.colorScheme.outline.copy(.12f))){Row(Modifier.fillMaxWidth().padding(15.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(17.dp),color=MaterialTheme.colorScheme.primaryContainer){Icon(contentCategoryIcon(category),null,Modifier.padding(12.dp).size(24.dp),tint=MaterialTheme.colorScheme.primary)};Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(contentCategoryTitle(category),fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium);Text("$count ملف",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Rounded.ChevronLeft,null,tint=MaterialTheme.colorScheme.primary)}}
}

@Composable
private fun FileCard(f:CourseFile,isFavorite:Boolean,downloads:DownloadController,onFavorite:()->Unit,onRead:()->Unit,onDownload:()->Unit,onShare:()->Unit){
    var state by remember(f.id){mutableStateOf<DownloadState>(downloads.status(f))}
    var openWhenReady by remember(f.id) { mutableStateOf(false) }
    val favoriteScale by animateFloatAsState(if(isFavorite) 1.16f else 1f, spring(dampingRatio = .45f, stiffness = Spring.StiffnessMedium), label = "favorite")
    LaunchedEffect(f.id,state){
        while(state is DownloadState.Downloading){delay(700);state=downloads.status(f)}
        if (openWhenReady && state is DownloadState.Done) { openWhenReady = false; onRead() }
    }
    val tone=subjectTone(f.subjectName)
    Card(modifier=Modifier.animateContentSize(),shape=RoundedCornerShape(24.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.surface),elevation=CardDefaults.cardElevation(defaultElevation=2.dp),border=BorderStroke(1.dp,MaterialTheme.colorScheme.outline.copy(.10f))){
        Column(Modifier.fillMaxWidth().padding(15.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
            Row(verticalAlignment=Alignment.Top){
                Image(painterResource(subjectArtworkRes(f.subjectId,f.subjectName)),null,Modifier.size(54.dp).clip(RoundedCornerShape(17.dp)),contentScale=ContentScale.Crop)
                Spacer(Modifier.width(10.dp))
                Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)){Text(f.displayName,fontWeight=FontWeight.ExtraBold,maxLines=2,overflow=TextOverflow.Ellipsis);Row(horizontalArrangement=Arrangement.spacedBy(6.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=CircleShape,color=MaterialTheme.colorScheme.surfaceVariant){Text(f.sizeText,Modifier.padding(horizontal=7.dp,vertical=3.dp),style=MaterialTheme.typography.labelSmall)};if(state is DownloadState.Done)Surface(shape=CircleShape,color=QraytiColors.Success.copy(.13f)){Row(Modifier.padding(horizontal=7.dp,vertical=3.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.OfflinePin,null,Modifier.size(13.dp),tint=QraytiColors.Success);Spacer(Modifier.width(3.dp));Text("أوفلاين",style=MaterialTheme.typography.labelSmall,color=QraytiColors.Success,fontWeight=FontWeight.Bold)}}};Text(listOf(f.sourceUniversity,f.sourceInstitution,f.sourceInstructor.takeIf{it.isNotBlank()}?.let{"الأستاذ: $it"}).filterNotNull().filter{it.isNotBlank()}.joinToString(" • "),style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant,maxLines=2,overflow=TextOverflow.Ellipsis)}
                IconButton(onClick=onFavorite, modifier = Modifier.graphicsLayer { scaleX = favoriteScale; scaleY = favoriteScale }){Icon(if(isFavorite)Icons.Rounded.Star else Icons.Rounded.StarBorder,if(isFavorite)"انزع من المفضلة" else "أضف للمفضلة",tint=if(isFavorite)MaterialTheme.colorScheme.tertiary else LocalContentColor.current)}
            }
            AnimatedVisibility(state is DownloadState.Downloading, enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
                val p=(state as? DownloadState.Downloading)?.progress ?: -1f
                if(p>=0) LinearProgressIndicator(progress={p},modifier=Modifier.fillMaxWidth()) else LinearProgressIndicator(modifier=Modifier.fillMaxWidth())
            }
            AnimatedVisibility(state is DownloadState.Failed,enter=fadeIn()+expandVertically(),exit=fadeOut()+shrinkVertically()){
                Surface(shape=RoundedCornerShape(14.dp),color=MaterialTheme.colorScheme.errorContainer){Row(Modifier.fillMaxWidth().padding(10.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.ErrorOutline,null,tint=MaterialTheme.colorScheme.error);Spacer(Modifier.width(7.dp));Column{Text("التحميل ما كملش",fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.onErrorContainer);Text("تثبّت من الإنترنت وعاود جرّب",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onErrorContainer.copy(.72f))}}}
            }
            HorizontalDivider(color=MaterialTheme.colorScheme.outline.copy(.10f))
            Row(horizontalArrangement=Arrangement.spacedBy(8.dp),verticalAlignment=Alignment.CenterVertically){
                Button(onClick={
                    openWhenReady = state !is DownloadState.Done
                    onRead()
                    state = downloads.status(f)
                },modifier=Modifier.weight(1f),shape=RoundedCornerShape(16.dp)){Icon(if(state is DownloadState.Failed)Icons.Rounded.Refresh else Icons.AutoMirrored.Rounded.MenuBook,null);Spacer(Modifier.width(6.dp));Text(when{state is DownloadState.Done->"افتح";state is DownloadState.Failed->"عاود التحميل";else->"حمّل وافتح"})}
                FilledTonalIconButton(onClick={onDownload();state=downloads.status(f)}){AnimatedContent(state is DownloadState.Done,label="download action"){done->Icon(if(done)Icons.Rounded.Delete else Icons.Rounded.Download,if(done)"احذف من الجهاز" else "حمّل للأوفلاين")}}
                IconButton(onClick=onShare){Icon(Icons.Rounded.Share,"شارك")}
            }
        }
    }
}


@Composable private fun SearchScreen(catalog:CatalogRepository,user:UserStore,downloads:DownloadController,userRev:Int,onUserChanged:()->Unit,message:(String)->Unit){
    var query by remember{mutableStateOf("")};var results by remember{mutableStateOf(emptyList<CourseFile>())};var searching by remember{mutableStateOf(false)};var sort by remember{mutableStateOf(FileSort.SMART)};var sortOpen by remember{mutableStateOf(false)};var historyRev by remember{mutableIntStateOf(0)};val context=LocalContext.current;val fav=user.favorites();val history=remember(historyRev){user.searchHistory()}
    LaunchedEffect(query) {
        val requested = query.trim()
        if (requested.length < 2) { results = emptyList(); searching = false }
        else { searching = true; delay(220); results = catalog.search(requested); if(results.isNotEmpty()){user.rememberSearch(requested);historyRev++}; searching = false }
    }
    val shownResults=remember(results,sort){
        val filtered=results
        when(sort){
            FileSort.SMART->filtered.sortedWith(compareByDescending<CourseFile>{it.id in fav}.thenBy{CatalogRepository.normalize(it.displayName)})
            FileSort.FAVORITES->filtered.sortedWith(compareByDescending<CourseFile>{it.id in fav}.thenBy{CatalogRepository.normalize(it.displayName)})
            FileSort.NAME->filtered.sortedBy{CatalogRepository.normalize(it.displayName)}
            FileSort.SIZE_DESC->filtered.sortedByDescending{it.size}
            FileSort.SIZE_ASC->filtered.sortedBy{it.size}
            FileSort.SOURCE->filtered.sortedWith(compareBy<CourseFile>{CatalogRepository.normalize(it.sourceUniversity)}.thenBy{CatalogRepository.normalize(it.displayName)})
        }
    }
    Column(Modifier.fillMaxSize().padding(horizontal=14.dp,vertical=10.dp)){
        SectionTitle("اكتشف أي كور","لوّج باسم المادة، الملف أو الجامعة")
        Spacer(Modifier.height(11.dp))
        OutlinedTextField(
            value=query,
            onValueChange={query=it},
            modifier=Modifier.fillMaxWidth(),
            singleLine=true,
            placeholder={Text("مثال: Java، Réseau، TD…")},
            leadingIcon={Icon(Icons.Rounded.Search,null)},
            trailingIcon=if(query.isNotEmpty()) {{IconButton(onClick={query=""}){Icon(Icons.Rounded.Close,"امسح البحث")}}} else null,
            shape=RoundedCornerShape(20.dp),
        )
        if(query.isBlank()&&history.isNotEmpty()) Row(Modifier.horizontalScroll(rememberScrollState()).padding(top=8.dp),horizontalArrangement=Arrangement.spacedBy(7.dp)){
            history.forEach{term->SuggestionChip({query=term},{Text(term,maxLines=1)})}
            AssistChip({user.clearSearchHistory();historyRev++},{Text("امسح")},leadingIcon={Icon(Icons.Rounded.DeleteSweep,null,Modifier.size(17.dp))})
        }
        Spacer(Modifier.height(10.dp));Row(verticalAlignment=Alignment.CenterVertically){Text(if(query.length<2)"اكتب حرفين على الأقل" else if(searching)"نلوج…" else "${shownResults.size} نتيجة",style=MaterialTheme.typography.labelMedium,modifier=Modifier.weight(1f));Box{TextButton({sortOpen=true}){Icon(Icons.AutoMirrored.Rounded.Sort,null,Modifier.size(18.dp));Spacer(Modifier.width(5.dp));Text(sort.label)};DropdownMenu(sortOpen,{sortOpen=false}){FileSort.entries.forEach{option->DropdownMenuItem({Text(option.label)},{sort=option;sortOpen=false})}}}}
        LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(10.dp),contentPadding=PaddingValues(vertical=10.dp)){
            if(query.isBlank())item{MascotTipCard("اكتب اللي في بالك","اسم مادة، نوع ملف كيما TD وTP، ولا حتى اسم الجامعة. نرتّبولك النتائج الأهم أولاً.")}
            else if(query.length>=2&&!searching&&shownResults.isEmpty())item{EmptyBlock("ما لقيناش نتيجة. جرّب اسم المادة أو نوع الملف.")}
            items(shownResults,key={it.id}){f->FileCard(f,f.id in fav,downloads,onFavorite={user.toggleFavorite(f.id);onUserChanged()},onRead={user.markRecent(f.id);user.setLastFile(f.id);val local=downloads.localFile(f).takeIf{downloads.isDownloaded(f)};if(local!=null)FileActions.open(context,f,local) else{downloads.enqueue(f);message("نحمّل فيه… يفتح وحده كي يكمل")}},onDownload={if(downloads.isDownloaded(f))downloads.remove(f) else downloads.enqueue(f)},onShare={FileActions.share(context,f)})}
        }
    }
}

@Composable
private fun SavedScreen(
    catalog: CatalogRepository,
    user: UserStore,
    downloads: DownloadController,
    userRev: Int,
    onUserChanged: () -> Unit,
    message: (String) -> Unit,
) {
    val favIds = user.favorites()
    val recentIds = user.recent()
    var tab by remember { mutableIntStateOf(0) }
    val context = LocalContext.current
    val requestedIds = if (tab == 0) favIds.toList() else if(tab == 1) recentIds else emptyList()
    val files by produceState(emptyList<CourseFile>(), tab, requestedIds, userRev) {
        value = when(tab){
            0 -> catalog.filesByIds(requestedIds).sortedBy { CatalogRepository.normalize(it.displayName) }
            1 -> catalog.filesByIds(requestedIds)
            else -> withContext(Dispatchers.IO){catalog.allStatic().filter(downloads::isDownloaded).sortedBy{CatalogRepository.normalize(it.displayName)}}
        }
    }

    Column(Modifier.fillMaxSize().padding(14.dp)) {
        TabRow(selectedTabIndex = tab) {
            Tab(selected = tab == 0, onClick = { tab = 0 }, text = { Text("المفضلة ⭐") })
            Tab(selected = tab == 1, onClick = { tab = 1 }, text = { Text("آخر ما فتحت") })
            Tab(selected = tab == 2, onClick = { tab = 2 }, text = { Text("أوفلاين") })
        }
        LazyColumn(
            Modifier.weight(1f),
            contentPadding = PaddingValues(vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            if (files.isEmpty()) {
                item { EmptyBlock("ما فما شيء هنا توا.") }
            } else {
                items(files, key = { it.id }) { f ->
                    FileCard(
                        f = f,
                        isFavorite = f.id in favIds,
                        downloads = downloads,
                        onFavorite = { user.toggleFavorite(f.id); onUserChanged() },
                        onRead = {
                            user.markRecent(f.id)
                            user.setLastFile(f.id)
                            val local = downloads.localFile(f).takeIf { downloads.isDownloaded(f) }
                            if (local != null) {
                                FileActions.open(context, f, local)
                            } else {
                                downloads.enqueue(f)
                                message("نحمّل فيه… يفتح وحده كي يكمل")
                            }
                        },
                        onDownload = {
                            if (downloads.isDownloaded(f)) downloads.remove(f) else downloads.enqueue(f)
                        },
                        onShare = { FileActions.share(context, f) },
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable private fun ProfileScreen(user:UserStore,downloads:DownloadController,theme:AppTheme,onThemeChange:(AppTheme)->Unit,checkingUpdate:Boolean,onEditProfile:()->Unit,onCheckUpdate:()->Unit,onCalculator:()->Unit,onEnglish:()->Unit,onFrench:()->Unit,onFaq:()->Unit){
    val context=LocalContext.current
    var showContact by remember{mutableStateOf(false)}
    LazyColumn(Modifier.fillMaxSize(),contentPadding=PaddingValues(16.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
        item{SectionTitle("حسابي","بياناتك، شكل التطبيق وأدوات القراية")}
        item{
            val university=TunisianUniversities.byId(user.universityId)
            Surface(shape=RoundedCornerShape(28.dp),color=university?.color?.copy(.11f)?:MaterialTheme.colorScheme.primaryContainer,border=BorderStroke(1.dp,university?.color?.copy(.18f)?:MaterialTheme.colorScheme.primary.copy(.12f))){Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){if(university!=null)UniversityBadge(university,Modifier.sizeIn(minWidth=62.dp,minHeight=56.dp)) else Icon(Icons.Rounded.Person,null);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(user.profileName.ifBlank{"طالب قرايتي"},fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text(listOfNotNull(university?.name,user.facultyName.takeIf{it.isNotBlank()}).joinToString(" • "),style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant,maxLines=2,overflow=TextOverflow.Ellipsis);if(user.profileAge.isNotBlank())Text("${user.profileAge} سنة",style=MaterialTheme.typography.labelSmall,color=university?.color?:MaterialTheme.colorScheme.primary)};IconButton(onEditProfile){Icon(Icons.Rounded.Edit,"بدّل بياناتك")}}}
        }
        item {
            Card {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) { Icon(Icons.Rounded.Palette,null); Spacer(Modifier.width(9.dp)); Column{Text("شكل التطبيق",fontWeight=FontWeight.Bold);Text("فاتح، داكن، ولا Qrayti Pop",style=MaterialTheme.typography.labelSmall,color=MaterialTheme.colorScheme.onSurfaceVariant)} }
                    SingleChoiceSegmentedButtonRow(Modifier.fillMaxWidth()) {
                        listOf(AppTheme.LIGHT to "فاتح", AppTheme.DARK to "داكن", AppTheme.POP to "Pop").forEachIndexed { index, item ->
                            SegmentedButton(
                                selected = theme == item.first,
                                onClick = { onThemeChange(item.first) },
                                shape = SegmentedButtonDefaults.itemShape(index = index, count = 3),
                            ) { Text(item.second) }
                        }
                    }
                }
            }
        }
        item { NoticeCard("ملفات الأوفلاين", "${downloads.downloadedCount()} ملف • ${formatBytes(downloads.downloadedBytes())} • مخزنين داخل Qrayti فقط") }
        item{ToolCard("✨","تحديثات قرايتي",if(checkingUpdate)"نتثبّت من آخر نسخة…" else "نسختك ${BuildConfig.VERSION_NAME} • تثبّت من تحديث جديد",onCheckUpdate)}
        item{ToolCard("📤","شارك قرايتي","ابعث التطبيق لصحابك من الرابط الرسمي") {
            context.startActivity(Intent.createChooser(Intent(Intent.ACTION_SEND).apply{type="text/plain";putExtra(Intent.EXTRA_TEXT,"قرايتي — كور وTD وTP للطلبة في تونس\n${BuildConfig.BASE_URL}/api/android")},"شارك قرايتي"))
        }}
        item{ToolCard("🧮","حاسبة السداسي","المعاملات و10 طرق حساب، وتنجم تعطل مادة بعلامة ✕.",onCalculator)}
        item{ToolCard("🇬🇧","اختبار English","10 أسئلة سريعة تعطيك مستوى تقريبي.",onEnglish)}
        item{ToolCard("🇫🇷","اختبار Français","اختبار صغير من A1 إلى C1.",onFrench)}
        item{ToolCard("🤖","بديس القراي","FAQ يتحيّن من الموقع والـAdmin.",onFaq)}
        item{ToolCard("☎️","تواصل","ابعث كور لقرايتي أو تواصل مع صاحب التطبيق",onClick={showContact=true})}
        item{ToolCard("🌍","الموقع","افتح qrayti.pages.dev") {context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse(BuildConfig.BASE_URL)))}}
    }
    if(showContact)ContactDialog(
        onDismiss={showContact=false},
        onContribute={showContact=false;context.startActivity(Intent(Intent.ACTION_SENDTO,Uri.parse("mailto:9rayti.learn@gmail.com?subject=مساهمة كور في قرايتي")))},
        onOwner={showContact=false;context.startActivity(Intent(Intent.ACTION_VIEW,Uri.parse("https://www.instagram.com/amine.akermii/")))},
    )
}
@Composable private fun ToolCard(icon:String,title:String,text:String,onClick:()->Unit){Card(onClick=onClick){Row(Modifier.fillMaxWidth().padding(16.dp),verticalAlignment=Alignment.CenterVertically){Text(icon,fontSize=28.sp);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(title,fontWeight=FontWeight.Bold);Text(text,style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Rounded.ChevronLeft,null)}}}
@Composable private fun ContactDialog(onDismiss:()->Unit,onContribute:()->Unit,onOwner:()->Unit){
    AlertDialog(
        onDismissRequest=onDismiss,
        icon={Icon(Icons.Rounded.ContactSupport,null)},
        title={Text("تواصل",fontWeight=FontWeight.Black)},
        text={Column(verticalArrangement=Arrangement.spacedBy(10.dp)){
            Surface(onClick=onContribute,shape=RoundedCornerShape(18.dp),color=MaterialTheme.colorScheme.primaryContainer){Row(Modifier.fillMaxWidth().padding(14.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.UploadFile,null,tint=MaterialTheme.colorScheme.primary);Spacer(Modifier.width(10.dp));Column{Text("ابعث كور لقرايتي",fontWeight=FontWeight.Black);Text("Cours، TD، TP، امتحانات أو ملاحظات",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onPrimaryContainer.copy(.70f))}}}
            Surface(onClick=onOwner,shape=RoundedCornerShape(18.dp),color=MaterialTheme.colorScheme.secondaryContainer){Row(Modifier.fillMaxWidth().padding(14.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.Person,null,tint=MaterialTheme.colorScheme.secondary);Spacer(Modifier.width(10.dp));Column{Text("تواصل مع صاحب قرايتي",fontWeight=FontWeight.Black);Text("للأسئلة والاقتراحات فقط",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSecondaryContainer.copy(.70f))}}}
        }},
        confirmButton={TextButton(onClick=onDismiss){Text("سكر")}},
    )
}

@Composable
private fun CalculatorScreen(
    key: SemesterKey,
    catalog: CatalogRepository,
    user: UserStore,
    message: (String) -> Unit,
) {
    var activeKey by remember(key){mutableStateOf(key)}
    fun selectKey(next:SemesterKey){activeKey=next;user.selectedLicence=next.licence;user.selectedYear=next.year;user.selectedSemester=next.semester;user.selectedTrack=next.track}
    val files by produceState<List<CourseFile>?>(null, activeKey) { value = catalog.semesterFiles(activeKey) }
    val subjects = remember(files) {
        files?.groupBy { it.subjectId }
            ?.map { (id, fs) -> id to (fs.firstOrNull()?.subjectName ?: id) }
            ?.sortedBy { it.second }
            .orEmpty()
    }
    val excluded = user.excludedSubjects(activeKey)
    val rows = remember(activeKey,subjects) {
        mutableStateListOf<GradeRow>().apply {
            subjects.forEach { (id, name) -> add(GradeRow(id, name, excluded = id in excluded)) }
        }
    }
    fun update(index: Int, value: GradeRow) { rows[index] = value }
    val values = rows.mapNotNull { row ->
        if (row.excluded) null else calculateRow(row)?.let { it to row.coefficient }
    }
    val computed = if (values.isEmpty()) null else values.sumOf { it.first * it.second } / values.sumOf { it.second }

    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionTitle("احسب معدّلي", "اختيارات واضحة، وبعدها أعدادك والنتيجة تتبدّل وحدها") }
        item {
            Surface(shape=RoundedCornerShape(25.dp),color=MaterialTheme.colorScheme.surface,border=BorderStroke(1.dp,MaterialTheme.colorScheme.outline.copy(.10f))){
              Column(Modifier.padding(14.dp),verticalArrangement=Arrangement.spacedBy(9.dp)){
                Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(13.dp),color=MaterialTheme.colorScheme.primaryContainer){Text("1",Modifier.padding(horizontal=10.dp,vertical=6.dp),fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.primary)};Spacer(Modifier.width(8.dp));Text("إجازتك",fontWeight=FontWeight.Black)}
                Row(Modifier.horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(7.dp)){
                    listOf("info","lce","lt").forEach{licence->FilterChip(selected=activeKey.licence==licence,onClick={selectKey(SemesterKey(licence,1,1,"common"))},label={Text(ProgrammeNames.licenceArabic(licence))},leadingIcon=if(activeKey.licence==licence){{Icon(Icons.Rounded.Check,null,Modifier.size(16.dp))}}else null,shape=RoundedCornerShape(13.dp))}
                }
                HorizontalDivider(color=MaterialTheme.colorScheme.outline.copy(.10f))
                Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(13.dp),color=MaterialTheme.colorScheme.secondaryContainer){Text("2",Modifier.padding(horizontal=10.dp,vertical=6.dp),fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.secondary)};Spacer(Modifier.width(8.dp));Text("السنة",fontWeight=FontWeight.Black)}
                Row(Modifier.horizontalScroll(rememberScrollState()),horizontalArrangement=Arrangement.spacedBy(7.dp)){
                    val years=if(activeKey.licence=="info")listOf(1,2)else listOf(1)
                    years.forEach{year->FilterChip(selected=activeKey.year==year,onClick={selectKey(SemesterKey(activeKey.licence,year,activeKey.semester,if(activeKey.licence=="info"&&year==2)"genie" else "common"))},label={Text(if(year==1)"السنة الأولى" else "السنة الثانية")},leadingIcon=if(activeKey.year==year){{Icon(Icons.Rounded.Check,null,Modifier.size(16.dp))}}else null,shape=RoundedCornerShape(13.dp))}
                }
                HorizontalDivider(color=MaterialTheme.colorScheme.outline.copy(.10f))
                Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(13.dp),color=MaterialTheme.colorScheme.tertiaryContainer){Text("3",Modifier.padding(horizontal=10.dp,vertical=6.dp),fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.tertiary)};Spacer(Modifier.width(8.dp));Text("السداسي",fontWeight=FontWeight.Black)}
                Row(horizontalArrangement=Arrangement.spacedBy(7.dp)){listOf(1,2).forEach{semester->FilterChip(selected=activeKey.semester==semester,onClick={selectKey(activeKey.copy(semester=semester))},label={Text("السداسي $semester")},leadingIcon=if(activeKey.semester==semester){{Icon(Icons.Rounded.Check,null,Modifier.size(16.dp))}}else null,shape=RoundedCornerShape(13.dp))}}
              }
            }
        }
        item {
            Card(shape=RoundedCornerShape(29.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.primaryContainer),border=BorderStroke(1.dp,MaterialTheme.colorScheme.primary.copy(.10f))){
                Row(Modifier.fillMaxWidth().heightIn(min=158.dp).padding(15.dp),verticalAlignment=Alignment.CenterVertically){
                    GradeRing(computed,Modifier.size(116.dp))
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(7.dp)){
                        Text("النتيجة توا",color=MaterialTheme.colorScheme.primary,fontWeight=FontWeight.Bold)
                        Text(gradeMessage(computed),color=MaterialTheme.colorScheme.onPrimaryContainer,fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium)
                        Text(if(computed==null)"افتح مادة وعمّر أعدادها." else "محسوب من ${values.size} مواد.",color=MaterialTheme.colorScheme.onPrimaryContainer.copy(.64f),style=MaterialTheme.typography.bodySmall)
                    }
                    Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.width(64.dp).height(126.dp),contentScale=ContentScale.Fit)
                }
            }
        }
        item{Row(verticalAlignment=Alignment.CenterVertically){Surface(shape=RoundedCornerShape(13.dp),color=MaterialTheme.colorScheme.primaryContainer){Text("4",Modifier.padding(horizontal=10.dp,vertical=6.dp),fontWeight=FontWeight.Black,color=MaterialTheme.colorScheme.primary)};Spacer(Modifier.width(8.dp));Column{Text("أعداد المواد",fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium);Text("افتح المادة اللي تحب تعمّرها",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)}}}
        if(files==null)item{LoadingBlock()} else if(rows.isEmpty())item{EmptyBlock("ما لقيناش مواد للسداسي هذا.")}
        itemsIndexed(rows, key = { _, row -> row.subjectId }) { index, row ->
            GradeSubjectCard(
                r = row,
                initiallyExpanded=index==0,
                onToggle = {
                    val isExcluded = user.toggleExcluded(activeKey, row.subjectId)
                    update(index, row.copy(excluded = isExcluded))
                },
                onChange = { update(index, it) },
            )
        }
        item { NoticeCard("كيفاش تتحسب؟", "كل مادة عندها معامل وطريقة حساب. بدّلهم كان نظام جامعتك مختلف. المادة المستثناة ما تدخلش في المعدّل.") }
        item { Spacer(Modifier.height(40.dp)) }
    }
}

@Composable
private fun GradeSubjectCard(r: GradeRow,initiallyExpanded:Boolean=false,onToggle: () -> Unit, onChange: (GradeRow) -> Unit) {
    var formulaOpen by remember { mutableStateOf(false) }
    var expanded by remember(r.subjectId){mutableStateOf(initiallyExpanded)}
    val formula = GradeFormulas.all.firstOrNull { it.id == r.formulaId } ?: GradeFormulas.all.first()
    Card(
        onClick={expanded=!expanded},
        shape=RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (r.excluded) MaterialTheme.colorScheme.surfaceVariant.copy(.55f) else MaterialTheme.colorScheme.surface,
        ),
        border=BorderStroke(1.dp,if(r.excluded)MaterialTheme.colorScheme.outline.copy(.12f) else MaterialTheme.colorScheme.primary.copy(.12f)),
    ) {
        Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(painterResource(subjectArtworkRes(r.subjectId,r.subjectName)),null,Modifier.size(50.dp).clip(RoundedCornerShape(15.dp)),contentScale=ContentScale.Crop)
                Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f)){Text(r.subjectName,fontWeight=FontWeight.ExtraBold,maxLines=2);Text(calculateRow(r)?.let{"${round(it*100)/100} / 20"}?:if(r.excluded)"ما تدخلش في المعدّل" else "مازال ناقص أعداد",style=MaterialTheme.typography.labelMedium,color=if(calculateRow(r)!=null)gradeColor(calculateRow(r)!!)else MaterialTheme.colorScheme.onSurfaceVariant)}
                FilterChip(selected=!r.excluded,onClick=onToggle,label={Text(if(r.excluded)"رجّعها" else "محسوبة")},leadingIcon={Icon(if(r.excluded)Icons.Rounded.Add else Icons.Rounded.Check,null,Modifier.size(15.dp))})
                Icon(if(expanded)Icons.Rounded.KeyboardArrowUp else Icons.Rounded.KeyboardArrowDown,null)
            }
            AnimatedVisibility(expanded&&!r.excluded,enter=fadeIn()+expandVertically(),exit=fadeOut()+shrinkVertically()){
              Column(verticalArrangement=Arrangement.spacedBy(9.dp)){
                HorizontalDivider(color=MaterialTheme.colorScheme.outline.copy(.12f))
                Text("طريقة الحساب",fontWeight=FontWeight.Bold,style=MaterialTheme.typography.labelLarge)
                Box{
                    OutlinedButton(onClick={formulaOpen=true},modifier=Modifier.fillMaxWidth(),shape=RoundedCornerShape(15.dp)){Text(formula.label,Modifier.weight(1f),maxLines=1,overflow=TextOverflow.Ellipsis);Icon(Icons.Rounded.ExpandMore,null)}
                    DropdownMenu(expanded=formulaOpen,onDismissRequest={formulaOpen=false}){GradeFormulas.all.forEach{f->DropdownMenuItem(text={Text(f.label)},onClick={onChange(r.copy(formulaId=f.id));formulaOpen=false})}}
                }
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                    GradeInput("TP",r.tp,true,Modifier.weight(1f)){onChange(r.copy(tp=it))}
                    GradeInput("DS",r.ds,true,Modifier.weight(1f)){onChange(r.copy(ds=it))}
                }
                Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){
                    GradeInput("Examen",r.exam,true,Modifier.weight(1f)){onChange(r.copy(exam=it))}
                    GradeInput("المعامل",r.coefficient.toString(),true,Modifier.weight(1f)){onChange(r.copy(coefficient=it.toDoubleOrNull()?.coerceIn(.1,20.0)?:r.coefficient))}
                }
                calculateRow(r)?.let{Surface(shape=RoundedCornerShape(14.dp),color=gradeColor(it).copy(.12f)){Row(Modifier.fillMaxWidth().padding(11.dp),verticalAlignment=Alignment.CenterVertically){Icon(Icons.Rounded.AutoGraph,null,tint=gradeColor(it));Spacer(Modifier.width(8.dp));Text("معدل المادة",Modifier.weight(1f),fontWeight=FontWeight.Bold);Text("${round(it*100)/100} / 20",fontWeight=FontWeight.Black,color=gradeColor(it))}}}
              }
            }
        }
    }
}

@Composable private fun GradeInput(label:String,value:String,enabled:Boolean,modifier:Modifier,onChange:(String)->Unit){OutlinedTextField(value,{v->if(v.length<=5&&v.all{it.isDigit()||it=='.'||it==','})onChange(v.replace(',','.'))},modifier=modifier,enabled=enabled,label={Text(label,fontWeight=FontWeight.Bold)},suffix={Text(if(label=="المعامل")"×" else "/20",style=MaterialTheme.typography.labelSmall)},singleLine=true,shape=RoundedCornerShape(15.dp))}
@Composable private fun GradeRing(value:Double?,modifier:Modifier=Modifier){
    val target=((value?:0.0)/20.0).toFloat().coerceIn(0f,1f)
    val progress by animateFloatAsState(target,tween(900,easing=FastOutSlowInEasing),label="grade ring")
    val tone=gradeColor(value)
    val ink=MaterialTheme.colorScheme.onPrimaryContainer
    Box(modifier,contentAlignment=Alignment.Center){Canvas(Modifier.fillMaxSize().padding(10.dp)){drawArc(ink.copy(.11f),-90f,360f,false,style=Stroke(width=15f,cap=StrokeCap.Round));drawArc(tone,-90f,360f*progress,false,style=Stroke(width=15f,cap=StrokeCap.Round))};Column(horizontalAlignment=Alignment.CenterHorizontally){Text(value?.let{"${round(it*100)/100}"}?:"—",fontSize=27.sp,fontWeight=FontWeight.Black,color=ink);Text("/ 20",style=MaterialTheme.typography.labelMedium,color=ink.copy(.58f))}}
}
private fun gradeColor(value:Double?):Color=when{value==null->QraytiColors.Cyan;value>=14->QraytiColors.Success;value>=10->QraytiColors.Gold;else->Color(0xFFFF6B6B)}
private fun gradeMessage(value:Double?):String=when{value==null->"ابدأ بأول مادة";value>=15->"بروجلية ممتاز 🔥";value>=12->"ماشي في الثنية الصحيحة";value>=10->"ناجح، زيد شوية تركيز";else->"تنجم تطلعها، مادة بمادة"}
private fun calculateRow(r: GradeRow): Double? {
    if (r.excluded) return null
    val f = GradeFormulas.all.firstOrNull { it.id == r.formulaId } ?: return null
    fun score(raw: String, weight: Double): Double? {
        if (weight == 0.0) return 0.0
        return raw.toDoubleOrNull()?.takeIf { it in 0.0..20.0 }
    }
    val tp = score(r.tp, f.tp) ?: return null
    val ds = score(r.ds, f.ds) ?: return null
    val exam = score(r.exam, f.exam) ?: return null
    return tp * f.tp + ds * f.ds + exam * f.exam
}

private data class TestQ(val level:String,val q:String,val options:List<String>,val answer:Int)
private val enQuestions=listOf(
    TestQ("A1","I ___ a university student.",listOf("am","is","are","be"),0),TestQ("A1","She ___ from Tunisia.",listOf("am","are","is","be"),2),
    TestQ("A2","Yesterday, I ___ to university early.",listOf("go","went","gone","going"),1),TestQ("A2","I have lived here ___ 2024.",listOf("for","since","from","during"),1),
    TestQ("B1","If I ___ more time, I would read more.",listOf("have","had","will have","having"),1),TestQ("B1","He told me that he ___ tired.",listOf("is","was","has","be"),1),
    TestQ("B2","Despite ___ tired, she finished the project.",listOf("be","being","was","to be"),1),TestQ("B2","If I had studied more, I ___ the exam.",listOf("pass","would pass","would have passed","passed"),2),
    TestQ("C1","No sooner ___ than the presentation began.",listOf("we arrived","had we arrived","we had arrive","did we arrived"),1),TestQ("C1","Had I known, I ___ earlier.",listOf("would come","came","would have come","had come"),2))
private val frQuestions=listOf(
    TestQ("A1","Je ___ étudiant à l’université.",listOf("suis","es","est","sommes"),0),TestQ("A1","Nous ___ en Tunisie.",listOf("habite","habitez","habitons","habites"),2),
    TestQ("A2","Hier, je ___ à la fac tôt.",listOf("vais","suis allé","aller","irai"),1),TestQ("A2","J’apprends le français ___ deux ans.",listOf("depuis","pendant","dans","à"),0),
    TestQ("B1","Si j’___ plus de temps, je lirais davantage.",listOf("ai","avais","aurai","avoir"),1),TestQ("B1","Il m’a dit qu’il ___ fatigué.",listOf("est","était","sera","soit"),1),
    TestQ("B2","Bien qu’il ___ fatigué, il a continué.",listOf("est","était","soit","sera"),2),TestQ("B2","C’est le livre ___ je t’ai parlé.",listOf("que","qui","dont","où"),2),
    TestQ("C1","À peine ___ arrivé que le cours a commencé.",listOf("il était","était-il","il est","sera-t-il"),1),TestQ("C1","Quoi qu’il en ___, on terminera.",listOf("est","soit","sera","était"),1))

@Composable
private fun LanguageTestScreen(lang: String) {
    val qs = if (lang == "fr") frQuestions else enQuestions
    var index by remember { mutableIntStateOf(0) }
    var correct by remember { mutableIntStateOf(0) }
    var done by remember { mutableStateOf(false) }

    if (done) {
        val pct = correct * 100 / qs.size
        val level = when {
            pct < 30 -> "A1"
            pct < 45 -> "A2"
            pct < 65 -> "B1"
            pct < 85 -> "B2"
            else -> "C1"
        }
        Box(Modifier.fillMaxSize().padding(24.dp), contentAlignment = Alignment.Center) {
            Card {
                Column(
                    Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("$pct%", fontSize = 48.sp, fontWeight = FontWeight.Black, color = MaterialTheme.colorScheme.primary)
                    Text("مستوى تقريبي: $level", fontWeight = FontWeight.Bold)
                    Text("النتيجة للتوجيه فقط، موش شهادة رسمية.")
                    Button(onClick = { index = 0; correct = 0; done = false }) { Text("عاود الاختبار") }
                }
            }
        }
        return
    }

    val q = qs[index]
    Column(Modifier.fillMaxSize().padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Text(
            "${if (lang == "fr") "Français" else "English"} • ${index + 1}/${qs.size}",
            color = MaterialTheme.colorScheme.primary,
            fontWeight = FontWeight.Bold,
        )
        LinearProgressIndicator(progress = { (index + 1f) / qs.size }, modifier = Modifier.fillMaxWidth())
        Text(q.q, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        q.options.forEachIndexed { i, option ->
            OutlinedButton(
                onClick = {
                    if (i == q.answer) correct++
                    if (index == qs.lastIndex) done = true else index++
                },
                modifier = Modifier.fillMaxWidth(),
            ) { Text(option) }
        }
        Text("من A1 إلى C1 • اختبار سريع", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
private fun FaqScreen(remote: RemoteConfigRepository) {
    val data by produceState<Pair<String, List<FaqItem>>?>(null) { value = remote.faq() }
    var open by remember { mutableStateOf<String?>(null) }
    LazyColumn(
        Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item { SectionTitle(data?.first ?: "بديس القراي", "الأسئلة تتحيّن من Admin متاع الموقع") }
        if (data == null) {
            item { LoadingBlock() }
        } else {
            items(data!!.second, key = { it.question }) { f ->
                Card(onClick = { open = if (open == f.question) null else f.question }) {
                    Column(Modifier.fillMaxWidth().padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(f.question, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                            Icon(if (open == f.question) Icons.Rounded.ExpandLess else Icons.Rounded.ExpandMore, null)
                        }
                        AnimatedVisibility(open == f.question) {
                            Text(f.answer, Modifier.padding(top = 10.dp), color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun MascotDialog(name: String, s: MascotScenario, onDismiss: () -> Unit) {
    var reply by remember { mutableStateOf<String?>(null) }
    AlertDialog(
        onDismissRequest = onDismiss,
        icon = { Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.height(104.dp),contentScale=ContentScale.Fit) },
        title = { Text(name) },
        text = { Text(reply ?: s.prompt) },
        confirmButton = {
            if (reply == null) {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    s.choices.take(2).forEach { c -> TextButton(onClick = { reply = c.reply }) { Text(c.label) } }
                }
            } else {
                TextButton(onClick = onDismiss) { Text("كمّل نقرا") }
            }
        },
        dismissButton = { if (reply == null) TextButton(onClick = onDismiss) { Text("بعد") } },
    )
}
private fun weightedRandom(list:List<MascotScenario>):MascotScenario{val total=list.sumOf{it.weight.coerceAtLeast(1)};var n=Random.nextInt(total);for(x in list){n-=x.weight.coerceAtLeast(1);if(n<0)return x};return list.first()}

@Composable private fun MascotTipCard(title:String,text:String){
    Card(shape=RoundedCornerShape(24.dp),colors=CardDefaults.cardColors(containerColor=MaterialTheme.colorScheme.primaryContainer)){
        Row(Modifier.fillMaxWidth().heightIn(min=112.dp).padding(horizontal=14.dp),verticalAlignment=Alignment.CenterVertically){
            Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.width(88.dp).height(108.dp),contentScale=ContentScale.Fit)
            Spacer(Modifier.width(10.dp));Column(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(5.dp)){Text(title,fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleMedium);Text(text,style=MaterialTheme.typography.bodySmall,color=MaterialTheme.colorScheme.onPrimaryContainer)}
        }
    }
}
@Composable private fun LoadingBlock(){
    val transition=rememberInfiniteTransition(label="loading mascot")
    val scale by transition.animateFloat(.92f,1.04f,infiniteRepeatable(tween(700,easing=FastOutSlowInEasing),RepeatMode.Reverse),label="loading pulse")
    Column(Modifier.fillMaxWidth().height(170.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.Center){Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.height(96.dp).graphicsLayer{scaleX=scale;scaleY=scale},contentScale=ContentScale.Fit);Spacer(Modifier.height(5.dp));Text("نحضّرلك الكور…",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary)}
}
@Composable private fun EmptyBlock(text:String){Column(Modifier.fillMaxWidth().padding(24.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(7.dp)){Image(painterResource(R.drawable.qrayti_mascot_v12),null,Modifier.height(130.dp),contentScale=ContentScale.Fit);Text(text,color=MaterialTheme.colorScheme.onSurfaceVariant,fontWeight=FontWeight.Bold)}}
