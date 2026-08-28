import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.qrayti.informatiquebeta"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.qrayti.informatiquebeta"
        minSdk = 28
        targetSdk = 36
        versionCode = 22
        versionName = "1.12.0"
        vectorDrawables.useSupportLibrary = true
        buildConfigField("String", "BASE_URL", "\"https://qrayti.pages.dev\"")
    }

    androidResources {
        localeFilters += listOf("ar", "en", "fr")
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        create("rc") {
            initWith(getByName("release"))
            signingConfig = signingConfigs.getByName("debug")
            isDebuggable = false
            matchingFallbacks += listOf("release")
        }
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.17.0")
    implementation("androidx.activity:activity-compose:1.11.0")

    val composeBom = platform("androidx.compose:compose-bom:2025.08.00")
    implementation(composeBom)

    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.work:work-runtime-ktx:2.11.2")

    debugImplementation(composeBom)
    debugImplementation("androidx.compose.ui:ui-tooling")

    testImplementation("junit:junit:4.13.2")
}
