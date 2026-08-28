package com.qrayti.informatiquebeta

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

class RemoteConfigRepository {
    suspend fun faq(): Pair<String,List<FaqItem>> = withContext(Dispatchers.IO) {
        runCatching {
            val root = getJson("${BuildConfig.BASE_URL}/api/faq")
            // The public endpoint wraps the remotely managed FAQ in { "config": ... }.
            // Accept both the current wrapped shape and the legacy flat shape.
            val config = root.optJSONObject("config") ?: root
            val name = config.optString("name","بديس القراي")
            val arr = config.optJSONArray("items")
            val list = buildList {
                if(arr!=null) for(i in 0 until arr.length()) {
                    val o=arr.getJSONObject(i)
                    val question=o.optString("question").trim();val answer=o.optString("answer").trim()
                    if(o.optBoolean("enabled",true)&&question.isNotEmpty()&&answer.isNotEmpty()) add(FaqItem(question,answer))
                }
            }
            name to if(config.optBoolean("enabled",true)&&list.isNotEmpty()) list else DefaultContent.faq
        }.getOrElse { "بديس القراي" to DefaultContent.faq }
    }

    suspend fun mascot(): Pair<String,List<MascotScenario>> = withContext(Dispatchers.IO) {
        runCatching {
            val root=getJson("${BuildConfig.BASE_URL}/api/mascot")
            val name=root.optString("name","حما غراب")
            val arr=root.optJSONArray("scenarios")
            val list=buildList {
                if(arr!=null) for(i in 0 until arr.length()) {
                    val o=arr.getJSONObject(i); if(!o.optBoolean("enabled",true)) continue
                    val ca=o.optJSONArray("choices")
                    val choices=buildList { if(ca!=null) for(j in 0 until ca.length()){val c=ca.getJSONObject(j);add(MascotChoice(c.optString("label"),c.optString("reply")))} }
                    add(MascotScenario(o.optString("prompt"),choices,o.optInt("weight",1)))
                }
            }
            name to list
        }.getOrElse { "حما غراب" to DefaultContent.mascot }
    }

    private fun getJson(url:String):JSONObject {
        val c=(URL(url).openConnection() as HttpURLConnection).apply{connectTimeout=6000;readTimeout=8000;setRequestProperty("Accept","application/json")}
        return try { if(c.responseCode !in 200..299) error("HTTP ${c.responseCode}"); JSONObject(c.inputStream.bufferedReader().readText()) } finally { c.disconnect() }
    }
}

object DefaultContent {
    val mascot=listOf(
        MascotScenario("توا هذا وضع؟ هذي حياة؟ 😭", listOf(MascotChoice("خلّيني نقرا يا حما","إي باهي باهي… كمّل قبل ما نزيد نهبطلك المعنويات 😭"),MascotChoice("عندك حل؟","عندي: سكّر التليفون واقرا. حلّ عبقري نعرف 😎")),3),
        MascotScenario("نمشي نخدم كنتاري أحسن من تحضير للعوام؟ نشوف نلقى ليهم خدمة ولا لا مبعد 😭", listOf(MascotChoice("امشي اخدم 😂","لا لا نستنى… يمكن الشابتر هذا يطلع فيه مستقبل."),MascotChoice("اقعد ساكت","حاضر يا أستاذ. نرجعلك بعد شوية 👀")),2),
        MascotScenario("واا بس… من غادي تحب تنقل؟ 😏", listOf(MascotChoice("من حتى حد","هكا نحبك. اقرا وحدك يا مثقّف 😒"),MascotChoice("ورّيني أول 😭","لا يا فالح، أنا نحرّض برك وما نعطيش techniques 😂")),2),
        MascotScenario("اسمع… عندك دينار زايد ما تعرفش وين تحطّو؟ 👀", listOf(MascotChoice("نعطيهولك؟ 😭","ابعثو على D17 متاع حما غراب… ههه نضحك معاك، خلي دينارك واشري بيه كسكروت 😂"),MascotChoice("لا يا متحيّلة","ياخي باهي… حتى دينار ما عطيتوني، ونقعد نحضّر في العوام 😒")),1),
        MascotScenario("ياخي تقرا ولا تعمل في Scroll رياضي؟ 👀", listOf(MascotChoice("نقرا والله","نصدّقك المرة هاذي. كمّل 😏"),MascotChoice("شدّيتني 😭","إي شدّيتك. توا ارجع للشابتر.")),3),
    )
    val faq=listOf(
        FaqItem("كيفاش نلقى الكور متاع مادّتي بسرعة؟","اختار الإجازة، السنة والسداسي، وبعدها المادة. داخل المادة تلقى Cours وTD وTP والفيديوهات كل واحد في بلاصتو."),
        FaqItem("الكور هذا لازم يكون من نفس جامعتي باش ينفعني؟","موش بالضرورة. برشة مواد وبرامج يتشابهو بين الجامعات. قارن اسم المادة والشابتر بالبرنامج اللي تقراه."),
        FaqItem("كيفاش نعرف الملف جاي من أي جامعة؟","تلقى المصدر تحت الملف وقت يكون معروف. ما ننسبوش ملف لجامعة بلا دليل."),
        FaqItem("شنوّة وضع حقوق الكور والملفات؟","قرايتي يفهرس ملفات تعليمية كانت منشورة ومتداولة على الإنترنت، لكن هذا ما يعنيش أن عندنا ترخيصًا من كل أستاذ أو جامعة. الأفضل تسأل الأستاذ أو الجهة المالكة قبل إعادة النشر. إذا عطاوكم الإذن، تواصلوا معنا من خانة «ابعث كور لقرايتي» ونذكروا الجامعة والأستاذ بوضوح. وإذا صاحب حق طلب حذف ملف، نحّيوه."),
        FaqItem("نجم نحمّل الملف ولا لازم نقراه داخل التطبيق؟","تنجم تقراه إذا النوع مدعوم وتنجم تحمّلو للأوفلاين. Packet Tracer وZIP يلزمهم البرنامج المناسب."),
        FaqItem("لقيت تصنيف غالط، شنعمل؟","ادخل لخانة تواصل، وبعدها اختار ابعث كور لقرايتي وابعثلنا اسم الملف والغلط."),
    )
}
