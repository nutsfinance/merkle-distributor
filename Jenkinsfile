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
          sh "npm install -g yarn"
          sh "npm install -g ts-node"
          sh "yarn install"
          sh "ts-node rewards/run_taiksm.ts"
        }
      }
    }
  }
}
