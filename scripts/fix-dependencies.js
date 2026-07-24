const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'node_modules', 'react-native-accurate-step-counter', 'android', 'build.gradle');

if (fs.existsSync(targetPath)) {
  console.log('Patching react-native-accurate-step-counter/android/build.gradle...');
  const newContent = `
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
`;
  fs.writeFileSync(targetPath, newContent, 'utf8');
  console.log('Patch successfully applied!');
} else {
  console.warn('Target path not found:', targetPath);
}
