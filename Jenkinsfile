pipeline {
    agent any

    stages {
        stage('Version') {
            steps {
                script {
                    def sha = bat(returnStdout: true, script: '@git rev-parse --short HEAD').trim().split("\r?\n")[-1]
                    env.APP_VERSION = "1.0.${env.BUILD_NUMBER}-${sha}"
                }
                echo "Building version ${env.APP_VERSION}"
            }
        }

        stage('Install Backend') {
            steps {
                bat 'cd backend && npm ci'
            }
        }

        stage('Test') {
            steps {
                bat 'cd backend && npm test'
            }
        }

        stage('Build Frontend') {
            steps {
                bat 'cd frontend && npm ci && npm run build'
            }
        }

        stage('Package') {
            steps {
                bat "tar -a -c -f spendwise-${env.APP_VERSION}.zip backend\\src backend\\package.json frontend\\dist"
                archiveArtifacts artifacts: "spendwise-${env.APP_VERSION}.zip", fingerprint: true
            }
        }
    }
}