pipeline {
  options {
    disableConcurrentBuilds()
  }
  agent {
    kubernetes{
      yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-s3
  containers:
  - name: build
    image: node:16
    tty: true
    command: ['cat']
    env:
    - name: MNEMONIC
      valueFrom:
        secretKeyRef:
          name: jenkins-mnemonic
          key: mnemonic
"""
    }
  }
  stages {
    stage('Build') {
      when {
        branch 'master'
      }
      steps {
        container(name: 'build') {
          sh "mkdir -p /root/.config/hardhat-nodejs && chmod -R 777 /root/"
          sh "yarn install"
          sh "npx hardhat run rewards/run_taiksm.ts"
        }
      }
    }
  }
}
