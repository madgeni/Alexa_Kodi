# Alexa_Kodi

log in to https://console.aws.amazon.com
Go to IoT:

Click on Create a Resource:
Select 'Create a Thing' and give it a name (This will be for your Lambda Code) then 'Create'
Select 'View Thing', then on the right, click 'Connect a Device'
Select Node.JS, then click on Generate Cert and Policy - then download the 3 files. 

Repeat this, but this one is for your Local KODI - so name it appropriately.
(Also download a root cert:) 
https://www.symantec.com/content/en/us/enterprise/verisign/roots/VeriSign-Class%203-Public-Primary-Certification-Authority-G5.pem

& rename it as rootCA.pem

rename the 3 cert files (3 for each 'Thing') to:
private.pem.key
certificate.pem.crt
root-CA.crt

then store them in the /certs/ folders you downloaded from my repo.

You'll need to create an Alexa skill - Skill Type: Custom Interaction Model

NOTE - Select English(U.K) - I was unable to invoke this skill using English U.S, even tho it's running in Virginia.

Name it, give it an invocation name (i use kodi), select 'Yes' for Audio Player, then Next.
Add the enforced Pause/Resume Intents, then copy in the intents from the SampleIntents.txt file. DO the same for the Utterances, 
and add in Slots for MOVIES and SHOWS.
then Next.

