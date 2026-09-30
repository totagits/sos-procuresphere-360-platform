param(
  [string]$ProjectId = "sba-msme-portal-lr",
  [string]$Region = "europe-west1",
  [string]$WebService = "sos-procuresphere-360",
  [string]$ApiService = "sos-procuresphere-360-api",
  [string]$Repository = "cloud-run-source-deploy"
)

$ErrorActionPreference = "Stop"

function Invoke-GCloudStep {
  param(
    [string]$Command
  )

  cmd /c $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command"
  }
}

$apiImage = "$Region-docker.pkg.dev/$ProjectId/$Repository/$ApiService"
$webImage = "$Region-docker.pkg.dev/$ProjectId/$Repository/$WebService"

Write-Host "Building API image: $apiImage"
Invoke-GCloudStep "gcloud.cmd --quiet builds submit . --project=$ProjectId --region=$Region --config=infra/cloudbuild.api.yaml --substitutions=_IMAGE=$apiImage"

Write-Host "Deploying API service: $ApiService"
Invoke-GCloudStep "gcloud.cmd --quiet run deploy $ApiService --project=$ProjectId --region=$Region --image $apiImage --allow-unauthenticated --memory 512Mi --cpu 1 --max-instances 5"

$apiUrl = cmd /c "gcloud.cmd run services describe $ApiService --project=$ProjectId --region=$Region --format=value(status.url)"
$apiUrl = $apiUrl.Trim()

if (-not $apiUrl) {
  throw "API URL could not be resolved after deployment."
}

Write-Host "Resolved API URL: $apiUrl"
Write-Host "Building Web image: $webImage"
Invoke-GCloudStep "gcloud.cmd --quiet builds submit . --project=$ProjectId --region=$Region --config=infra/cloudbuild.web.yaml --substitutions=_IMAGE=$webImage,_VITE_API_URL=$apiUrl/api/v1"

Write-Host "Deploying Web service: $WebService"
Invoke-GCloudStep "gcloud.cmd --quiet run deploy $WebService --project=$ProjectId --region=$Region --image $webImage --allow-unauthenticated --memory 512Mi --cpu 1 --max-instances 5 --port 8080"

$webUrl = cmd /c "gcloud.cmd run services describe $WebService --project=$ProjectId --region=$Region --format=value(status.url)"
$webUrl = $webUrl.Trim()

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Web: $webUrl"
Write-Host "API: $apiUrl"
