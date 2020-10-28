# **[NoBis](https://nobis.dei.unipd.it)**
##A REST-based Node.js Web Application to Monitor Room Crowding in Covid-19 Era

**Design and Developed with by** 
* Avanzi Mattia
* Cisotto Giulia
* Coniglio Riccardo
* Giordani Marco
***

## Index
- [**NoBis**](#nobis)
  - [Index](#index)
  - [Introduction](#introduction)
  - [Project Structure](#project-structure)
  - [REST API Documentation](#rest-api-documentation)
  - [Error Codes Documentation](#error-codes-documentation)

***
## Introduction

NoBis is as a totally anonymous service that permits to measure, in real-time, how crowded the public environments are. The objective is to make it possible for city residents, visitors, workers, travelers, and the whole community to identify in advance the most crowded areas and adapt their mobility decisions accordingly. NoBis is implemented based on the QR technology, a matrix-type barcode that, when scanned, triggers check-in/check-out operations to/from the public spaces that are being monitored. NoBis imposes as an anonymous, privacy-compliant, easy-to-use, ready-to- deploy, and totally free service, and represents a promising tool in the fight against the spreading of the COVID-19 pandemic. In this document we provide details about NoBis’ development status and implementation, and present the results of a preliminary on-the-field testing phase demonstrating the smooth and proper functioning of NoBis as well as its potential social impact on humanity and community.

[Go back to index](#index)

***
## Project Structure

Inside of the project directory we find:

  *   ``db``
  
  *   ``node_modules``

  *   ``public``

  *   ``routes``

  *   ``views``



The **``db``** folder contains the database dumps, SQL scripts to be executed by cron jobs, backups and needed functions to access the database.

The **``node_modules``** folder contains installed modules and their dependencies:

Instead **``public``** contains static web resources like:

  *  ``assets`` 

  *  ``css`` 

  *  ``fonts`` 

  *  ``img`` 

  *  ``js`` 


The **``routes``** folder contains all the routes needed to resolve all REST API requests

The **``views``** folder contains templates to create dynamic HTML pages using Handlebars

[Go back to index](#index)

***
## REST API Documentation
[Go to the REST Docs](REST.md)

[Go back to index](#index)

***

## Error Codes Documentation

***401*** Unauthorized to access the resource.

***404*** Unknown resource requested. 

***500*** Internal Server Error. (SQL or Node error)

[Go back to index](#index)

***

***
