# REST API Documentation

[Go back to README](README.md)

## Index
1. [List of Resources](#list-of-resources)
2. [REST Docs](#rest-documentation)

***
# List of Resources
The following list devides the resources according the route they follow inside the web application

* ### Admin
	* [Show Login Admin](#login-admin)
* ### Referent
	* [Show Login Referent](#login-referent)
	* [Show Create Referent](#create-referent)
  * [Show Restore Referent Password](#restore-referent-password)
  * [Show Enable Referent](#enable-referent)
  * [Show Disable Referent](#disable-referent)
* ### Place
  * [Show Create Place](#create-place)
  * [Show Update Place](#update-place)
  * [Show Delete Place](#delete-place)
  * [Show Enable Place](#enable-place)
  * [Show Disable Place](#disable-place)
  * [Show Get Place](#get-place)
  * [Show Download Place QR Codes](#download-place-qr-codes)
  * [Show Check-in in a Place](#check-in-in-a-place)
  * [Show Check-out from a Place](#check-out-from-a-place)
  * [Show Create Feedback](#create-feedback)
  * [Show Opening Hours Creation](#opening-hours-creation)
  * [Show Get Opening Hours](#get-opening-hours)
* ### Building
  * [Show Create Building](#create-building)
  * [Show Delete Building](#delete-building)
* ### Report
  * [Show Create Report](#create-report)
  * [Show Resolve Report](#resolve-report)
* ### User
  * [Show Get Places in a specific Bounding Box](#get-places-in-a-specific-bounding-box)
  * [Show Search for Places by input](#search-for-places-by-input)


[Go back on top](#Index)
***
# REST Documentation

### **Login Admin**

> Check the admin credentials, if correct the HTTP response will contain a cookie with an authorization JWT

* URL 
	* ``/admin/checkCredentials``
* Method
    * `POST`
* Data Params
	* email
  * password
  * remember
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `401 Not Authorized`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Login Referent**

> Check the referent credentials, if correct the HTTP response will contain a cookie with an authorization JWT

* URL 
	* ``/referent/checkCredentials``
* Method
    * `POST`
* Data Params
	* email
  * password
  * remember
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `401 Not Authorized`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Create Referent**

> Create a referent

* URL 
	* ``/referent/create``
* Method
    * `POST`
* Data Params
  * firstname
  * lastname
	* email
  * password
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Restore Referent Password**

> Restore the referent password

* URL 
	* ``/referent/changePassword``
* Method
    * `POST`
* Data Params
  * referentId
  * token
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Enable Referent**

> Enable a referent

* URL 
	* ``/referent/{id}/enable``
* Method
    * `POST`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Disable Referent**

> Disable a new referent

* URL 
	* ``/referent/{id}/disable``
* Method
    * `POST`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Create Place**

> Create a new place

* URL 
	* ``/place/create``
* Method
    * `POST`
* Data Params
  * placeName
  * placeLongitude
  * placeLatitude
  * placeCapacity
  * placeVisitTime
  * placeBuilding
  * placeCategory
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Update Place**

> Update a place

* URL 
	* ``/place/{uuid}/update``
* Method
    * `POST`
* Data Params
  * placeName
  * placeLongitude
  * placeLatitude
  * placeCapacity
  * placeVisitTime
  * placeBuilding
  * placeCategory
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Delete Place**

> Delete a place

* URL 
	* ``/place/{uuid}``
* Method
    * `DELETE`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Enable Place**

> Enable a place

* URL 
	* ``/place/{uuid}/disable``
* Method
    * `POST`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Disable Place**

> Disable a place so it will not be shown in the User Dashboard and a user will not be able to Check-in or Check-out

* URL 
	* ``/place/{uuid}/disable``
* Method
    * `POST`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Get Place**

> Retrieve information about a single place

* URL 
	* ``/place/{uuid}/get``
* Method
    * `GET`
* Access: Private
* Success Response
	* Code: `200 Success`
	* Content:
    ```javascript
        {
          "uuid": "7e1029c0-87e7-4a21-9635-a91039030ceb",
          "name": "DEI/A",
          "latitude": 45.408206888837206,
          "longitude": 11.894352436065676,
          "capacity": 1000,
          "visit_time": 1000,
          "building_id": 1,
          "category_id": 2
        }
    ```
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Download Place QR Codes**

> Download a zip containing QR Codes and printable PDF

* URL 
	* ``/place/{uuid}/qrcodes``
* Method
    * `GET`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Check-in in a Place**

> Register a Check-in in a place

* URL 
	* ``/place/{uuid}/check-in``
* Method
    * `POST`
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Check-out from a Place**

> Register a Check-out from a place

* URL 
	* ``/place/{uuid}/check-out``
* Method
    * `POST`
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Create Feedback**

> Create a Feedback related to a place (1 = low crowding, 2 = medium crowding and 3 = high crowding)

* URL 
	* ``/place/{uuid}/feedback``
* Method
    * `POST
* Data Params
  * feedback (1,2 or 3)
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Opening Hours Creation**

> Create or replace opening hours for a place

* URL 
	* ``/place/{uuid}/openings/replace``
* Method
    * `POST
* Data Params
  * intervals (array of weekday, start_hour and end_hour)
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Get Opening Hours**

> Retrieve opening hours about a place

* URL 
	* ``/place/{uuid}/opening/get``
* Method
    * `GET`
* Data Params
  * intervals (array of weekday, start_hour and end_hour)
* Access: Private
* Success Response
	* Code: `200 Success`
	* Content:
    ```javascript
        [
          {
            "id": 1,
            "place_uuid": "7e1029c0-87e7-4a21-9635-a91039030ced",
            "weekday": 1,
            "start_hour": "07:30:00",
            "end_hour": "21:00:00"
          },
          ...
        ]
    ```
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Create Building**

> Create a new building

* URL 
	* ``/building/create``
* Method
    * `POST`
* Data Params
  * buildingName
  * buildingLongitude
  * buildingLatitude
  * buildingAddress
  * buildingNumber
  * buildingProvince
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Delete Building**

> Delete a building (and all related places)

* URL 
	* ``/building/{uuid}``
* Method
    * `DELETE`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Create Report**

> Create a new report about a problem related to a check-in operation

* URL 
	* ``/report/create``
* Method
    * `POST`
* Data Params
  * problem (description)
* Access: Public
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Resolve Report**

> Mark a report as resolved

* URL 
	* ``/report/{id}/resolve``
* Method
    * `POST`
* Access: Private
* Success Response
	* Code: `200 Success`
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Get Places in a specific Bounding Box**

> Retrieve all places that are inside a specific Bounding Box (EPSG:4326)

* URL 
	* ``/mapInfo/findPlacesinMap``
* Method
    * `GET`
* Data Params
  * coorXmin (Es. 11.888322830200197)
  * coorYmin (Es. 45.40355745279116)
  * coorXmax (Es. 11.899909973144531)
  * coorYmax (Es. 45.412626228833275)
* Access: Public
* Success Response
	* Code: `200 Success`
	* Content:
    ```javascript
        [
          {
            "puuid": "d165cea3-6f90-4174-9ead-cdcbd0787fee",
            "pname": "SIGNET",
            "buildingname": "Complesso DEI",
            "category": "Laboratorio",
            "geocoord": "POINT(11.8944597244263 45.4089036121798)",
            "occ": "0.16",
            "highfeedback": "0",
            "mediumfeedback": "0",
            "lowfeedback": "0",
            "isopen": true
          },
          {
            "puuid": "7e1029c0-87e7-4a21-9635-a91039030ced",
            "pname": "DEI/A",
            "buildingname": "Complesso DEI",
            "category": "Edificio",
            "geocoord": "POINT(11.8943524360657 45.4082068888372)",
            "occ": "0.00",
            "highfeedback": "0",
            "mediumfeedback": "0",
            "lowfeedback": "0",
            "isopen": true
          },
          {
            "puuid": "dc7fe111-a66d-4d19-942b-33cd9214cd43",
            "pname": "Settore TLC-reti",
            "buildingname": "Complesso DEI",
            "category": "Laboratorio",
            "geocoord": "POINT(11.8943631649017 45.4077041128706)",
            "occ": "0.00",
            "highfeedback": "0",
            "mediumfeedback": "1",
            "lowfeedback": "0",
            "isopen": true
          }
        ]
    ```
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***

### **Search for Places by input**

> Retrieve all places which name contains a input string

* URL 
	* ``/mapInfo/searchPlaces``
* Method
    * `GET`
* Data Params
  * searchInput (ES. reti)
* Access: Public
* Success Response
	* Code: `200 Success`
	* Content:
    ```javascript
        [{
            "puuid": "dc7fe111-a66d-4d19-942b-33cd9214cd43",
            "pname": "Settore TLC-reti",
            "buildingname": "Complesso DEI",
            "category": "Laboratorio",
            "geocoord": "POINT(11.8943631649017 45.4077041128706)",
            "occ": "0.00",
            "isopen": true
        }]
    ```
* Success Response
	* Code: `500 Internal Server Error`

	   
[Go back to List of Resources](#list-of-resources)
***


[Go back on top](#Index)
