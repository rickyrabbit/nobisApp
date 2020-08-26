
// HTTP Errors
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


class BadRequestError extends HTTPError {
    constructor() {
        super("Request has invalid syntax", 400);
        this.name = 'BadRequestError';
    }
}

class UnAuthenticatedError extends HTTPError {
    constructor() {
        super("Client is not authenticated", 401);
        this.name = 'UnAuthenticatedError';
    }
}

class ForbiddenAccessError extends HTTPError {
    constructor() {
        super("Client doesn't have rights to access the content", 403);
        this.name = 'ForbiddenAccessError';
    }
}

class NotFoundError extends HTTPError {
    constructor() {
        super("Resource not found", 404);
        this.name = 'NotFoundError';
    }
}

class InternalServerError extends HTTPError {
    constructor() {
        super("Internal Server Error", 500);
        this.name = 'InternalServerError';
    }
}

class BadGatewayError extends HTTPError {
    constructor() {
        super("Bad Gateway", 502);
        this.name = 'BadGatewayError';
    }
}



// Database errors

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

class QueryError extends DBError {
    constructor(){
        super("Query syntax is incorrect");
        this.name = 'QueryError';
    }
}    
class InsertError extends DBError {
    constructor(){
        super("Insert went wrong");
        this.name = 'InsertError';
    }
}    
class UpdateError extends DBError {
    constructor(){
        super("Update went wrong");
        this.name = 'UpdateError';
    }
}    
class DeleteError extends DBError {
    constructor(){
        super("Delete went wrong");
        this.name = 'DeleteError';
    }
}   

// Server operations errors

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

class ModuleError extends InternalOperationError {
    constructor(module) {
        super();
        this.name = 'ModuleError';
        this.module = module;
    }
}



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
