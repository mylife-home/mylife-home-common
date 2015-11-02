'use strict';

// jrequest : id, type
// jresponse : id, type
// jres_data(jresponse) : data
// jres_error(jresponse) : message
// jres_success(jresponse)
// jreq_enum(jrequest)
// jreq_get(jrequest) : key
// jreq_set(jrequest) : key, value
// jres_success::type_def = "success";
// jres_error::type_def = "error";
// jreq_enum::type_def = "enum";
// jreq_enum::response_type_def = "rs_enum";
// jreq_get::type_def = "get";
// jreq_get::response_type_def = "rs_get";
// jreq_set::type_def = "set";
// jreq_set::response_type_def = "rs_set";

function resourceEnum(client, cb) {
  return client.execute({
    type : 'enum'
  }, (err, res) => {
    if(err) { return cb(err); }
    if(res.type === 'error') { return cb(res.message); }
    return cb(undefined, res.data);
  });
}

function resourceGet(client, key, cb) {
  return client.execute({
    type : 'get',
    key  : key
  }, (err, res) => {
    if(err) { return cb(err); }
    if(res.type === 'error') { return cb(res.message); }
    return cb(undefined, res.data);
  });
}

module.exports = {

  extendsClient : function(client) {
    client.resourceEnum = resourceEnum.bind(undefined, client);
    client.resourceGet = resourceGet.bind(undefined, client);
  },

  createError(message) {
    return {
      type    : 'error',
      message : message
    };
  },

  createSuccess() {
    return {
      type : 'success'
    };
  },

  createSessionList(list) {
    return {
      type : 'rs_session_list',
      data : list
    };
  }
};
