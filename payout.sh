#!/bin/bash

# Set variables
mail_content_file="resources/mail-content.txt"
dest_email_file="resources/dest-email.txt"
log_file="payout.log"
email_subject="Payout Stakers"

# Function to send email if mail content is not empty
send_email() {
    if [[ -s $mail_content_file ]]; then
        cat "$mail_content_file" | mail -s "$email_subject" $(cat "$dest_email_file")

        > "$mail_content_file"
    fi
}

# Create resources directory
mkdir -p resources
# Install dependencies and build
yarn install && yarn build

# Start the program in the background and log output
yarn start >> "$log_file" &

# Continuously check for new mail content every minute
while true; do
    send_email
    sleep 60
done

# Cleanup upon script exit
trap "rm -rf resources" EXIT
