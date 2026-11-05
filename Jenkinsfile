// SpendWise AI - Component 1 CI pipeline
// Place this file at the ROOT of the spendwise-ai repository.

pipeline {
    agent any

    tools {
        // Must match the NodeJS tool name configured in
        // Manage Jenkins -> Tools -> NodeJS installations
        nodejs 'node20'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    environment {
        CI         = 'true'
        JWT_SECRET = 'jenkins-ci-test-secret'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_SHA = sh(
                        returnStdout: true,
                        script: 'git rev-parse --short HEAD'
                    ).trim()
                    echo "Building commit ${env.GIT_SHA} (build #${env.BUILD_NUMBER})"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        // CI ENHANCEMENT: the test stage runs before the build stage.
        // If any Jest/Supertest test fails, the pipeline stops here and
        // no artifact is produced.
        stage('Test') {
            steps {
                dir('backend') {
                    sh 'npx jest --ci --runInBand --coverage --reporters=default --reporters=jest-junit'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/junit.xml'
                    publishHTML(target: [
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'backend/coverage/lcov-report',
                        reportFiles          : 'index.html',
                        reportName           : 'Jest Coverage Report'
                    ])
                }
            }
        }

        stage('Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Package & Archive Artifact') {
            steps {
                sh "tar -czf spendwise-frontend-${env.BUILD_NUMBER}-${env.GIT_SHA}.tar.gz -C frontend dist"
                archiveArtifacts artifacts: 'spendwise-frontend-*.tar.gz', fingerprint: true
            }
        }
    }

    post {
        success {
            echo "Pipeline succeeded for ${env.GIT_SHA}. Artifact: spendwise-frontend-${env.BUILD_NUMBER}-${env.GIT_SHA}.tar.gz"
        }
        failure {
            echo "Pipeline failed for ${env.GIT_SHA}. Check the Test stage console output."
        }
        always {
            cleanWs()
        }
    }

    triggers {
        // Poll SCM every 2 minutes (webhook is the faster alternative).
        pollSCM('H/2 * * * *')
    }
}
