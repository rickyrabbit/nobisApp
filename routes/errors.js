class HTTPError extends Error {
    constructor(message,statusCode) {
      super(message);
      this.name = "HTTPError";
      this.statusCode = statusCode;
    }
}


class DBError extends Error {
    constructor(message,type) {
      super(message);
      this.name = "DBError";
      this.type = type;
    }
}

// HTTP errors
const badRequest = new HTTPError("Request has invalid syntax", 400);
const unAuthenticated = new HTTPError("Client is not authenticated", 401);
const forbiddenAccess = new HTTPError("Client doesn't have rights to access the content", 403);
const notFound = new HTTPError("Resource not found", 404);

const internalServerError = new HTTPError("Internal Server Error", 500);
const badGateway = new HTTPError("Bad Gateway", 502);


// Database errors
const queryError = new DBError("Query syntax is incorrect", "DBERROR_QUERY");
const insertError = new DBError("Insert went wrong", "DBERROR_INSERT");
const updateError = new DBError("Update went wrong", "DBERROR_UPDATE");



module.exports = { 
    badRequest,
    unAuthenticated,
    forbiddenAccess,
    notFound,
    internalServerError,
    badGateway,
    queryError,
    insertError,
    updateError
}
