pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME = 'prateekdz/kanban-dashboard'
        CONTAINER_NAME = 'kanban-dashboard'
        HOST_PORT = '80'
        CONTAINER_PORT = '8080'
        HEALTH_URL = 'http://127.0.0.1:80/'
        DEPLOYMENT_ATTEMPTED = 'false'
        DEPLOYMENT_OK = 'false'
        PREVIOUS_IMAGE = ''
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm run build'
            }
        }

        stage('Build') {
            steps {
                sh 'docker build --pull --tag "$IMAGE_NAME:$BUILD_NUMBER" .'
            }
        }

        stage('Scan') {
            steps {
                sh '''
                    docker run --rm \
                      --volume "$WORKSPACE:/repo:ro" \
                      zricethezav/gitleaks:v8.24.3 \
                      detect --source=/repo --redact
                '''
                sh '''
                    docker run --rm \
                      --volume /var/run/docker.sock:/var/run/docker.sock \
                      aquasec/trivy:0.59.1 \
                      image --exit-code 1 --severity HIGH,CRITICAL \
                      "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        stage('Tag') {
            steps {
                script {
                    env.GIT_SHA = sh(
                        script: 'git rev-parse --short=12 HEAD',
                        returnStdout: true
                    ).trim()
                    sh 'docker tag "$IMAGE_NAME:$BUILD_NUMBER" "$IMAGE_NAME:$GIT_SHA"'
                }
            }
        }

        stage('Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set +x
                        printf '%s' "$DOCKERHUB_TOKEN" |
                          docker login --username "$DOCKERHUB_USERNAME" --password-stdin
                        trap 'docker logout >/dev/null 2>&1 || true' EXIT
                        docker push "$IMAGE_NAME:$BUILD_NUMBER"
                        docker push "$IMAGE_NAME:$GIT_SHA"
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    sh 'docker info >/dev/null'
                    def previousContainerStatus = sh(
                        script: 'docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1',
                        returnStatus: true
                    )
                    if (previousContainerStatus == 0) {
                        env.PREVIOUS_IMAGE = sh(
                            script: 'docker container inspect --format=\'{{.Config.Image}}\' "$CONTAINER_NAME"',
                            returnStdout: true
                        ).trim()
                    }

                    env.DEPLOYMENT_ATTEMPTED = 'true'
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'dockerhub-credentials',
                            usernameVariable: 'DOCKERHUB_USERNAME',
                            passwordVariable: 'DOCKERHUB_TOKEN'
                        )]) {
                            sh '''
                                set +x
                                printf '%s' "$DOCKERHUB_TOKEN" |
                                  docker login --username "$DOCKERHUB_USERNAME" --password-stdin
                                trap 'docker logout >/dev/null 2>&1 || true' EXIT
                                docker pull "$IMAGE_NAME:$BUILD_NUMBER"
                                if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
                                  docker rm --force "$CONTAINER_NAME"
                                fi
                                docker run --detach \
                                  --restart unless-stopped \
                                  --name "$CONTAINER_NAME" \
                                  --publish "$HOST_PORT:$CONTAINER_PORT" \
                                  "$IMAGE_NAME:$BUILD_NUMBER"
                            '''
                        }
                        env.DEPLOYMENT_OK = 'pending'
                    } catch (err) {
                        env.DEPLOYMENT_OK = 'false'
                        currentBuild.result = 'FAILURE'
                        echo "Deployment failed; rollback will be attempted: ${err}"
                    }
                }
            }
        }

        stage('Health Check') {
            when {
                expression { env.DEPLOYMENT_OK == 'pending' }
            }
            steps {
                script {
                    try {
                        sh '''
                            set -eu
                            test "$(docker inspect --format='{{.State.Running}}' "$CONTAINER_NAME")" = true
                            attempt=0
                            until curl --fail --silent "$HEALTH_URL" >/dev/null; do
                              attempt=$((attempt + 1))
                              if [ "$attempt" -ge 30 ]; then
                                echo "Health check failed: $HEALTH_URL" >&2
                                exit 1
                              fi
                              sleep 2
                            done
                        '''
                        env.DEPLOYMENT_OK = 'true'
                    } catch (err) {
                        env.DEPLOYMENT_OK = 'false'
                        currentBuild.result = 'FAILURE'
                        echo "Health check failed; rollback will be attempted: ${err}"
                    }
                }
            }
        }

        stage('Rollback') {
            when {
                expression {
                    env.DEPLOYMENT_ATTEMPTED == 'true' && env.DEPLOYMENT_OK != 'true'
                }
            }
            steps {
                script {
                    if (env.PREVIOUS_IMAGE?.trim()) {
                        sh '''
                            set -eu
                            if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
                              docker rm --force "$CONTAINER_NAME"
                            fi
                            docker run --detach \
                              --restart unless-stopped \
                              --name "$CONTAINER_NAME" \
                              --publish "$HOST_PORT:$CONTAINER_PORT" \
                              "$PREVIOUS_IMAGE"
                            test "$(docker inspect --format='{{.State.Running}}' "$CONTAINER_NAME")" = true
                            attempt=0
                            until curl --fail --silent "$HEALTH_URL" >/dev/null; do
                              attempt=$((attempt + 1))
                              if [ "$attempt" -ge 30 ]; then
                                echo "Rollback health check failed: $HEALTH_URL" >&2
                                exit 1
                              fi
                              sleep 2
                            done
                        '''
                        echo "Restored previous image: ${env.PREVIOUS_IMAGE}"
                    } else {
                        sh '''
                            if docker container inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
                              docker rm --force "$CONTAINER_NAME"
                            fi
                        '''
                        error('Deployment failed and there was no previous image to restore.')
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    set -eu
                    for image in $(docker image ls --format '{{.Repository}}:{{.Tag}}' "$IMAGE_NAME"); do
                      if [ "$image" != "$IMAGE_NAME:$BUILD_NUMBER" ] &&
                         [ "$image" != "$PREVIOUS_IMAGE" ]; then
                        docker image rm "$image"
                      fi
                    done
                '''
            }
        }
    }

    post {
        always {
            sh '''
                set -eu
                PREVIOUS_IMAGE="${PREVIOUS_IMAGE:-}"
                if [ -n "${GIT_SHA:-}" ] &&
                   [ "$IMAGE_NAME:$GIT_SHA" != "$PREVIOUS_IMAGE" ] &&
                   docker image inspect "$IMAGE_NAME:$GIT_SHA" >/dev/null 2>&1; then
                  docker image rm "$IMAGE_NAME:$GIT_SHA"
                fi
                if [ "$DEPLOYMENT_OK" != "true" ] &&
                   [ "$IMAGE_NAME:$BUILD_NUMBER" != "$PREVIOUS_IMAGE" ] &&
                   ! docker container ls --all --quiet \
                     --filter "ancestor=$IMAGE_NAME:$BUILD_NUMBER" | grep --quiet . &&
                   docker image inspect "$IMAGE_NAME:$BUILD_NUMBER" >/dev/null 2>&1; then
                  docker image rm "$IMAGE_NAME:$BUILD_NUMBER"
                fi
            '''
        }
    }
}
