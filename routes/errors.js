/*
 * Copyright 2020 Mattia Avanzi, Riccardo Coniglio, Università degli Studi di Padova
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// HTTP Errors

/**
 * Default class to handle HTTP errors.
 *
 * @class HTTPError
 * @extends {Error}
 */
class HTTPError extends Error {
    constructor(message,statusCode) {
      super(message);
      this.name = "HTTPError";
      this.statusCode = statusCode;
      this.reason = '';
    }
    setReason(reason){
        this.reason = reason;
    }
}

/**
 * Bad Request Error (400)
 *
 * @class BadRequestError
 * @extends {HTTPError}
 */
class BadRequestError extends HTTPError {
    constructor() {
        super("Request has invalid syntax", 400);
        this.name = 'BadRequestError';
    }
}

/**
 * UnAuthenticated Error (401)
 *
 * @class UnAuthenticatedError
 * @extends {HTTPError}
 */
class UnAuthenticatedError extends HTTPError {
    constructor() {
        super("Client is not authenticated", 401);
        this.name = 'UnAuthenticatedError';
    }
}

/**
 * Forbidden Access Error (403)
 *
 * @class ForbiddenAccessError
 * @extends {HTTPError}
 */
class ForbiddenAccessError extends HTTPError {
    constructor() {
        super("Client doesn't have rights to access the content", 403);
        this.name = 'ForbiddenAccessError';
    }
}

/**
 * Not Found Error (404)
 *
 * @class NotFoundError
 * @extends {HTTPError}
 */
class NotFoundError extends HTTPError {
    constructor() {
        super("Resource not found", 404);
        this.name = 'NotFoundError';
    }
}

/**
 * Internal Server Error (500)
 *
 * @class InternalServerError
 * @extends {HTTPError}
 */
class InternalServerError extends HTTPError {
    constructor() {
        super("Internal Server Error", 500);
        this.name = 'InternalServerError';
    }
}

/**
 * Bad Gateway Error (502)
 *
 * @class BadGatewayError
 * @extends {HTTPError}
 */
class BadGatewayError extends HTTPError {
    constructor() {
        super("Bad Gateway", 502);
        this.name = 'BadGatewayError';
    }
}



// Database errors

/**
 * Default class to handle Database errors.
 *
 * @class DBError
 * @extends {Error}
 */
class DBError extends Error {
    constructor(message) {
      super(message);
      this.name = "DBError";
      this.reason = '';
    }
    setReason(reason){
        this.reason = reason;
    }

}

/**
 * Query Error
 *
 * @class QueryError
 * @extends {DBError}
 */
class QueryError extends DBError {
    constructor(){
        super("Query syntax is incorrect");
        this.name = 'QueryError';
    }
}   

/**
 * Insert Error
 *
 * @class InsertError
 * @extends {DBError}
 */
class InsertError extends DBError {
    constructor(){
        super("Insert went wrong");
        this.name = 'InsertError';
    }
}    

/**
 * Update Error
 *
 * @class UpdateError
 * @extends {DBError}
 */
class UpdateError extends DBError {
    constructor(){
        super("Update went wrong");
        this.name = 'UpdateError';
    }
}    

/**
 * Delete Error
 *
 * @class DeleteError
 * @extends {DBError}
 */
class DeleteError extends DBError {
    constructor(){
        super("Delete went wrong");
        this.name = 'DeleteError';
    }
}   

// Server operations errors

/**
 * Internal Operation Error
 *
 * @class InternalOperationError
 * @extends {Error}
 */
class InternalOperationError extends Error {
    constructor() {
        super(`Internal Server Operation Error`);
        this.name = "InternalOperationError";
        this.reason = '';
      }
      setReason(reason){
          this.reason = reason;
      }
}

/**
 * Module Error
 *
 * @class ModuleError
 * @extends {InternalOperationError}
 */
class ModuleError extends InternalOperationError {
    constructor(module) {
        super();
        this.name = 'ModuleError';
        this.module = module;
    }
}

// Exports

module.exports = { 
    BadRequestError,
    UnAuthenticatedError,
    ForbiddenAccessError,
    NotFoundError,
    InternalServerError,
    BadGatewayError,
    QueryError,
    InsertError,
    UpdateError,
    DeleteError,
    InternalOperationError,
    ModuleError
}
