package com.qrayti.informatiquebeta

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.ui.text.input.KeyboardType

data class TunisianUniversity(
    val id: String,
    val name: String,
    val shortName: String,
    val city: String,
    val color: Color,
    val faculties: List<String>,
)

object TunisianUniversities {
    val all = listOf(
        TunisianUniversity("utm","جامعة تونس المنار","UTM","تونس",Color(0xFF2455A4),listOf("كلية العلوم بتونس","كلية الطب بتونس","المدرسة الوطنية للمهندسين بتونس","المعهد العالي للإعلامية","المعهد العالي للعلوم البيولوجية التطبيقية","مؤسسة أخرى")),
        TunisianUniversity("ucar","جامعة قرطاج","UCAR","تونس الكبرى",Color(0xFF008F9C),listOf("INSAT","المدرسة التونسية للتقنيات","IHEC قرطاج","كلية العلوم ببنزرت","المعهد العالي لتكنولوجيات المعلومات والاتصال","مؤسسة أخرى")),
        TunisianUniversity("ut","جامعة تونس","UT","تونس",Color(0xFFB72956),listOf("كلية العلوم الإنسانية والاجتماعية","المدرسة العليا للعلوم الاقتصادية والتجارية","المعهد العالي للتصرف","المعهد العالي للفنون الجميلة","مؤسسة أخرى")),
        TunisianUniversity("uma","جامعة منوبة","UMA","منوبة",Color(0xFF7749B8),listOf("كلية الآداب والفنون والإنسانيات","المدرسة الوطنية لعلوم الإعلامية","معهد الصحافة وعلوم الإخبار","المعهد العالي للمحاسبة وإدارة المؤسسات","مؤسسة أخرى")),
        TunisianUniversity("uso","جامعة سوسة","USO","سوسة",Color(0xFF007E69),listOf("كلية الطب بسوسة","المدرسة الوطنية للمهندسين بسوسة","المعهد العالي للإعلامية وتقنيات الاتصال","كلية الحقوق والعلوم السياسية","IHEC سوسة","مؤسسة أخرى")),
        TunisianUniversity("umo","جامعة المنستير","UMO","المنستير",Color(0xFF2769B0),listOf("كلية العلوم بالمنستير","كلية الطب بالمنستير","المدرسة الوطنية للمهندسين بالمنستير","المعهد العالي للإعلامية والرياضيات","ISET قصر هلال","مؤسسة أخرى")),
        TunisianUniversity("usf","جامعة صفاقس","USF","صفاقس",Color(0xFFB03B2E),listOf("كلية العلوم بصفاقس","كلية الطب بصفاقس","المدرسة الوطنية للمهندسين بصفاقس","المعهد العالي للإعلامية والملتيميديا","كلية العلوم الاقتصادية والتصرف","مؤسسة أخرى")),
        TunisianUniversity("uj","جامعة جندوبة","UJ","جندوبة",Color(0xFF5D812C),listOf("كلية العلوم القانونية والاقتصادية والتصرف","المعهد العالي للإعلامية بالكاف","المعهد العالي للغات التطبيقية والأعمال","المعهد العالي للدراسات التطبيقية في الإنسانيات","مؤسسة أخرى")),
        TunisianUniversity("uk","جامعة القيروان","UK","القيروان",Color(0xFF946B17),listOf("كلية الآداب والعلوم الإنسانية","المعهد العالي للإعلامية والتصرف","المعهد العالي للرياضيات التطبيقية والإعلامية","المعهد العالي للفنون والحرف","مؤسسة أخرى")),
        TunisianUniversity("uga","جامعة قابس","UGA","قابس",Color(0xFF00877C),listOf("كلية العلوم بقابس","المدرسة الوطنية للمهندسين بقابس","المعهد العالي للإعلامية والملتيميديا","المعهد العالي للتصرف","مؤسسة أخرى")),
        TunisianUniversity("ugf","جامعة قفصة","UGF","قفصة",Color(0xFFD07020),listOf("كلية العلوم بقفصة","المعهد العالي لإدارة المؤسسات","المعهد العالي للدراسات التطبيقية في الإنسانيات","مؤسسة أخرى")),
        TunisianUniversity("ez","جامعة الزيتونة","UZ","تونس",Color(0xFF35724A),listOf("المعهد العالي لأصول الدين","المعهد العالي للحضارة الإسلامية","مركز الدراسات الإسلامية بالقيروان","مؤسسة أخرى")),
    )

    fun byId(id: String): TunisianUniversity? = all.firstOrNull { it.id == id }
}

@Composable
fun UniversityBadge(university:TunisianUniversity,modifier:Modifier=Modifier){
    Surface(modifier=modifier,shape=RoundedCornerShape(17.dp),color=university.color,border=BorderStroke(2.dp,Color.White.copy(.48f))){
        Box(Modifier.padding(horizontal=10.dp,vertical=9.dp),contentAlignment=Alignment.Center){Text(university.shortName,color=Color.White,fontWeight=FontWeight.Black,fontSize=12.sp)}
    }
}

@Composable
fun OnboardingScreen(user:UserStore,onComplete:()->Unit){
    var step by remember{mutableIntStateOf(0)}
    var name by remember{mutableStateOf(user.profileName)}
    var age by remember{mutableStateOf(user.profileAge)}
    var university by remember{mutableStateOf(TunisianUniversities.byId(user.universityId))}
    var faculty by remember{mutableStateOf(user.facultyName)}
    var query by remember{mutableStateOf("")}
    val shown=remember(query){TunisianUniversities.all.filter{query.isBlank()||it.name.contains(query,true)||it.city.contains(query,true)||it.shortName.contains(query,true)}}

    Surface(Modifier.fillMaxSize(),color=MaterialTheme.colorScheme.background){
      Column(Modifier.fillMaxSize().statusBarsPadding()){
        Row(Modifier.fillMaxWidth().padding(horizontal=18.dp,vertical=12.dp),verticalAlignment=Alignment.CenterVertically){
            if(step>0)IconButton({step--}){Icon(Icons.Rounded.ArrowForward,"رجوع")}
            Column(Modifier.weight(1f)){Text("نجهّزولك قرايتي",fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text("${step+1} من 3",style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.primary)}
            Text("Q",fontWeight=FontWeight.Black,color=Color.White,modifier=Modifier.padding(10.dp))
        }
        LinearProgressIndicator(progress={ (step+1)/3f },modifier=Modifier.fillMaxWidth().height(5.dp))
        AnimatedContent(step,transitionSpec={fadeIn() togetherWith fadeOut()},label="onboarding") { page ->
          when(page){
            0->Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(22.dp),horizontalAlignment=Alignment.CenterHorizontally,verticalArrangement=Arrangement.spacedBy(15.dp)){
                Image(painterResource(R.drawable.qrayti_mascot_v12),"تميمة قرايتي",Modifier.height(190.dp),contentScale=ContentScale.Fit)
                Text("عسلامة! شنوّة اسمك؟",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black)
                Text("باش نخلّيو قرايتي أقرب ليك. عمرك اختياري وتنجم تتعدّاه.",color=MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(name,{name=it.take(32)},Modifier.fillMaxWidth(),singleLine=true,label={Text("اسمك")},leadingIcon={Icon(Icons.Rounded.Person,null)},shape=RoundedCornerShape(19.dp),keyboardOptions=KeyboardOptions(imeAction=ImeAction.Next))
                OutlinedTextField(age,{v->if(v.length<=2&&v.all(Char::isDigit))age=v},Modifier.fillMaxWidth(),singleLine=true,label={Text("العمر (اختياري)")},placeholder={Text("تنجم تخليه فارغ")},leadingIcon={Icon(Icons.Rounded.Cake,null)},shape=RoundedCornerShape(19.dp),keyboardOptions=KeyboardOptions(keyboardType=KeyboardType.Number,imeAction=ImeAction.Done))
                Button({step=1},Modifier.fillMaxWidth().height(54.dp),enabled=name.trim().length>=2,shape=RoundedCornerShape(18.dp)){Text("التالي",fontWeight=FontWeight.Black);Spacer(Modifier.width(7.dp));Icon(Icons.Rounded.ArrowBack,null)}
            }
            1->Column(Modifier.fillMaxSize().padding(horizontal=16.dp,vertical=14.dp)){
                Text("اختار جامعتك",style=MaterialTheme.typography.headlineMedium,fontWeight=FontWeight.Black);Text("جامعات تونس فقط — اللوغو والمدينة يعاونوك تلقاها بسهولة.",color=MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(12.dp));OutlinedTextField(query,{query=it},Modifier.fillMaxWidth(),singleLine=true,placeholder={Text("لوّج على الجامعة أو المدينة")},leadingIcon={Icon(Icons.Rounded.Search,null)},shape=RoundedCornerShape(18.dp));Spacer(Modifier.height(10.dp))
                LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(9.dp),contentPadding=PaddingValues(bottom=20.dp)){items(shown,key={it.id}){item->
                    Surface(onClick={university=item;faculty="";step=2},shape=RoundedCornerShape(22.dp),color=if(university?.id==item.id)item.color.copy(.11f) else MaterialTheme.colorScheme.surface,border=BorderStroke(1.dp,if(university?.id==item.id)item.color.copy(.35f) else MaterialTheme.colorScheme.outline.copy(.10f))){Row(Modifier.fillMaxWidth().padding(13.dp),verticalAlignment=Alignment.CenterVertically){UniversityBadge(item,Modifier.sizeIn(minWidth=57.dp,minHeight=52.dp));Spacer(Modifier.width(11.dp));Column(Modifier.weight(1f)){Text(item.name,fontWeight=FontWeight.Black);Text(item.city,style=MaterialTheme.typography.labelMedium,color=MaterialTheme.colorScheme.onSurfaceVariant)};Icon(Icons.Rounded.ChevronLeft,null,tint=item.color)}}
                }}
            }
            else->Column(Modifier.fillMaxSize().padding(horizontal=16.dp,vertical=14.dp)){
                val selected=university!!
                Row(verticalAlignment=Alignment.CenterVertically){UniversityBadge(selected);Spacer(Modifier.width(11.dp));Column{Text(selected.name,fontWeight=FontWeight.Black,style=MaterialTheme.typography.titleLarge);Text("اختار الكلية أو المعهد",color=MaterialTheme.colorScheme.onSurfaceVariant)}}
                Spacer(Modifier.height(14.dp));LazyColumn(Modifier.weight(1f),verticalArrangement=Arrangement.spacedBy(8.dp)){items(selected.faculties){option->
                    Surface(onClick={faculty=option},shape=RoundedCornerShape(19.dp),color=if(faculty==option)selected.color.copy(.13f) else MaterialTheme.colorScheme.surface,border=BorderStroke(1.dp,if(faculty==option)selected.color.copy(.42f) else MaterialTheme.colorScheme.outline.copy(.10f))){Row(Modifier.fillMaxWidth().padding(15.dp),verticalAlignment=Alignment.CenterVertically){Surface(shape=CircleShape,color=if(faculty==option)selected.color else MaterialTheme.colorScheme.surfaceVariant){Icon(if(faculty==option)Icons.Rounded.Check else Icons.Rounded.School,null,Modifier.padding(7.dp).size(18.dp),tint=if(faculty==option)Color.White else MaterialTheme.colorScheme.onSurfaceVariant)};Spacer(Modifier.width(10.dp));Text(option,Modifier.weight(1f),fontWeight=FontWeight.Bold,maxLines=2,overflow=TextOverflow.Ellipsis)}}
                }}
                Button(onClick={user.saveProfile(name.trim(),age,selected.id,faculty);onComplete()},modifier=Modifier.fillMaxWidth().padding(vertical=12.dp).height(54.dp),enabled=faculty.isNotBlank(),shape=RoundedCornerShape(18.dp)){Text("ادخل لقرايتي",fontWeight=FontWeight.Black);Spacer(Modifier.width(7.dp));Icon(Icons.Rounded.AutoAwesome,null)}
            }
          }
        }
      }
    }
}
