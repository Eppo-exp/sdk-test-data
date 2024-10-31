import com.android.build.gradle.internal.cxx.configure.gradleLocalProperties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.jetbrains.kotlin.android)
    jacoco

    id("com.ncorti.ktfmt.gradle") version "0.20.1"
}

apply {
    from("./jacoco.gradle")
}

jacoco {
    toolVersion = "0.8.12"
    reportsDirectory = layout.buildDirectory.dir("customJacocoReportDir")
}


val apiKey: String = gradleLocalProperties(
    project.rootDir,
    providers
).getProperty("cloud.eppo.apiKey")

val testRunnerHost: String = System.getenv("TEST_RUNNER_HOST") ?: "http://10.0.2.2"
val testRunnerPort: String = System.getenv("TEST_RUNNER_PORT")  ?: "3000"


android {
    buildFeatures.buildConfig = true

    namespace = "cloud.eppo.android.sdkrelay"
    compileSdk = 34

    defaultConfig {
        applicationId = "cloud.eppo.android.sdkrelay"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        buildConfigField( "String", "API_KEY", "\"" + apiKey + "\"")
        buildConfigField( "String", "TEST_RUNNER_HOST", "\"" +testRunnerHost+ "\"")
        buildConfigField( "String", "TEST_RUNNER_PORT", "\"" +testRunnerPort+ "\"")
    }

    buildTypes {
        debug {
            enableUnitTestCoverage = true
            enableAndroidTestCoverage = true
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.socketio)
    implementation(libs.jackson.databind)
    implementation(libs.eppo.android.sdk)
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.runtime.livedata)
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.ui.test.junit4)
    debugImplementation(libs.androidx.ui.tooling)
    debugImplementation(libs.androidx.ui.test.manifest)
}