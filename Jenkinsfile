pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        IMAGE_NAME     = 'prateekdz/kanban-dashboard'
        CONTAINER_PORT = '8080'
        PUBLIC_URL     = 'http://16.4.49.225'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test') {
            steps {
                sh '''
                    npm ci
                    npm run lint
                    npm run build
                '''
            }
        }

        // 1. Build a Docker image & 2. Generate image tags from build number and commit SHA
        stage('Build & Tag') {
            steps {
                script {
                    env.GIT_SHA = sh(script: 'git rev-parse --short=12 HEAD', returnStdout: true).trim()
                }
                sh '''
                    docker build --pull \
                        --tag "$IMAGE_NAME:$BUILD_NUMBER" \
                        --tag "$IMAGE_NAME:$GIT_SHA" .
                '''
            }
        }

        stage('Scan') {
            steps {
                sh '''
                    docker run --rm \
                        --volume "$WORKSPACE:/repo:ro" \
                        zricethezav/gitleaks:v8.24.3 \
                        detect --source=/repo --redact

                    docker run --rm \
                        --volume /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:0.59.1 \
                        image --exit-code 1 --severity HIGH,CRITICAL \
                        "$IMAGE_NAME:$BUILD_NUMBER"
                '''
            }
        }

        // 3. Log in to Docker Hub & 4. Push both image tags
        stage('Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USERNAME',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set +x
                        printf '%s' "$DOCKERHUB_TOKEN" | docker login --username "$DOCKERHUB_USERNAME" --password-stdin
                        trap 'docker logout >/dev/null 2>&1 || true' EXIT
                        docker push "$IMAGE_NAME:$BUILD_NUMBER"
                        docker push "$IMAGE_NAME:$GIT_SHA"
                    '''
                }
            }
        }

        stage('Deploy & Switch Traffic') {
            steps {
                script {
                    def activePort = sh(
                        script: "grep -oE '808[12]' /etc/nginx/conf.d/kanban.conf 2>/dev/null | head -n1 || echo ''",
                        returnStdout: true
                    ).trim()

                    def newPort = (activePort == '8081') ? '8082' : '8081'
                    env.OLD_CONTAINER = activePort ? "kanban-${activePort}" : ''
                    env.NEW_CONTAINER = "kanban-${newPort}"
                    env.NEW_PORT      = newPort
                }

                // Start Green with limits and verify it before changing Nginx.
                sh '''
                    set -eu
                    docker pull "$IMAGE_NAME:$BUILD_NUMBER"
                    docker rm -f "$NEW_CONTAINER" 2>/dev/null || true

                    docker run -d \
                        --name "$NEW_CONTAINER" \
                        --restart unless-stopped \
                        --memory=512m \
                        --cpus=1.0 \
                        -p "127.0.0.1:${NEW_PORT}:${CONTAINER_PORT}" \
                        "$IMAGE_NAME:$BUILD_NUMBER"

                    for i in $(seq 1 20); do
                        if curl -fsS "http://127.0.0.1:${NEW_PORT}/" >/dev/null; then
                            echo "Green container ${NEW_CONTAINER} is healthy on port ${NEW_PORT}"
                            exit 0
                        fi
                        sleep 2
                    done
                    echo "Green container health check failed; Blue remains untouched" >&2
                    docker logs "$NEW_CONTAINER" || true
                    docker rm -f "$NEW_CONTAINER" || true
                    exit 1
                '''

                // Keep the active config available so any failed switch can restore Blue.
                sh '''
                    set -eu
                    config=/etc/nginx/conf.d/kanban.conf
                    backup=/etc/nginx/conf.d/kanban.conf.bak

                    if [ -f "$config" ]; then
                        sudo cp "$config" "$backup"
                    else
                        sudo rm -f "$backup"
                    fi

                    restore_previous() {
                        echo "Switch or public URL check failed; restoring previous Nginx config..." >&2
                        if [ -f "$backup" ]; then
                            if sudo cp "$backup" "$config" &&
                               sudo nginx -t &&
                               sudo systemctl reload nginx; then
                                echo "Previous Nginx config restored and reloaded."
                            else
                                echo "Failed to fully restore the previous Nginx config." >&2
                            fi
                        else
                            echo "No previous Nginx config backup is available." >&2
                        fi
                        docker rm -f "$NEW_CONTAINER" 2>/dev/null || true
                    }

                    if ! printf 'server {\n    listen 80;\n    server_name _;\n    location / {\n        proxy_pass http://127.0.0.1:%s;\n        proxy_set_header Host $host;\n        proxy_set_header X-Real-IP $remote_addr;\n        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n        proxy_set_header X-Forwarded-Proto $scheme;\n    }\n}\n' "${NEW_PORT}" |
                        sudo tee "$config" >/dev/null; then
                        restore_previous
                        exit 1
                    fi

                    if ! sudo nginx -t; then
                        restore_previous
                        exit 1
                    fi

                    if ! sudo systemctl reload nginx; then
                        restore_previous
                        exit 1
                    fi

                    if ! curl -fsS "${PUBLIC_URL}/" >/dev/null; then
                        restore_previous
                        exit 1
                    fi

                    echo "Public URL verified on Green (${NEW_CONTAINER})."
                    if [ -n "${OLD_CONTAINER:-}" ] && [ "${OLD_CONTAINER}" != "${NEW_CONTAINER}" ]; then
                        docker stop "$OLD_CONTAINER" || true
                        docker rm "$OLD_CONTAINER" || true
                        echo "Stopped and removed old Blue container ${OLD_CONTAINER}"
                    fi
                '''
            }
        }
    }

    post {
        always {
            sh 'docker image prune -f || true'
        }
    }
}
