const fs = require('fs');
const path = require('path');

/**
 * Patches a build.gradle file to remove jcenter() and replace with modern equivalents.
 */
function patchGradle(targetPath, newContent) {
  if (fs.existsSync(targetPath)) {
    console.log(`Patching: ${targetPath}`);
    fs.writeFileSync(targetPath, newContent, 'utf8');
    console.log('Patch successfully applied!\n');
  } else {
    console.warn(`File not found, skipping: ${targetPath}\n`);
  }
}

// -------------------------------------------------------
// 1. Patch react-native-accurate-step-counter
// -------------------------------------------------------
const stepCounterGradle = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'android', 'build.gradle'
);

patchGradle(stepCounterGradle, `
buildscript {
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.0'
    }
}

apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        targetSdkVersion safeExtGet('targetSdkVersion', 34)
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError false
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
`);

// -------------------------------------------------------
// 2. Patch react-native-shake (nested inside react-native-accurate-step-counter)
// -------------------------------------------------------
const shakeGradle = path.join(
  __dirname, '..', 'node_modules',
  'react-native-accurate-step-counter', 'node_modules',
  'react-native-shake', 'android', 'build.gradle'
);

patchGradle(shakeGradle, `
def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

apply plugin: 'com.android.library'

android {
    compileSdkVersion safeExtGet('compileSdkVersion', 34)
    buildToolsVersion safeExtGet('buildToolsVersion', '34.0.0')

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 21)
        versionCode 4
        versionName "4.0.0"
    }
    lintOptions {
       warning 'InvalidPackage'
    }
}

dependencies {
    implementation "com.facebook.react:react-native:+"
}

allprojects {
    repositories {
        maven { url "https://jitpack.io" }
        mavenLocal()
        google()
        mavenCentral()
        maven {
            url "$rootDir/../node_modules/react-native/android"
        }
    }
}
`);
