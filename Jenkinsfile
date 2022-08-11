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
  containers:
  - name: build
    image: node:16
    tty: true
    command: ['cat']
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
          sh "yarn install"
          sh "npx hardhat run rewards/run_taiksm.ts"
        }
      }
    }
  }
}
