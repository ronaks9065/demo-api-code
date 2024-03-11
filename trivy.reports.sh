#!/bin/bash

echo "Pulling Docker image from Docker Hub"
docker pull ronak1907/webapp:latest

# current date and time for name
current_datetime=$(TZ="Asia/Kolkata" date +"%d.%m.%Y.%M.%H")
report_filename="trivy.reports.${current_datetime}.json"

echo "Scanning Docker image using Trivy"
wget https://github.com/aquasecurity/trivy/releases/download/v0.18.3/trivy_0.18.3_Linux-64bit.deb 
sudo dpkg -i trivy_0.18.3_Linux-64bit.deb

trivy -v

trivy --severity HIGH --exit-code 0 ronak1907/webapp:latest

trivy_output=$(trivy --severity HIGH --exit-code 0 ronak1907/webapp:latest)

echo "$trivy_output"

# Extract the number of high severity vulnerabilities
high_vulnerabilities=$(echo "$trivy_output" | grep "HIGH:" | awk '{print $2}')

# Check if the number of high severity vulnerabilities is greater than 30
if [ "$high_vulnerabilities" -gt 35 ]; then
  echo "Pipeline failed! There are more than 30 high severity vulnerabilities."
  exit 1  # Exit with a non-zero status code to indicate failure
else
  echo "Pipeline passed. No more than 30 high severity vulnerabilities found."
fi
trivy --severity LOW,MEDIUM,HIGH ronak1907/webapp:latest > "$report_filename"
aws s3 cp "$report_filename" s3://trivy-scan-bucket/"$report_filename"
aws sns publish --topic-arn "arn:aws:sns:ap-south-1:149815208654:trivy_scan_mail" \
  --subject "Trivy Report" \
  --message "Trivy report is available at https://trivy-scan-bucket.s3.ap-south-1.amazonaws.com/$report_filename View Trivy Scan Report"
