package main

import (
	"rental-platform/pkg/shared/httputil"
)

var writeAPIError = httputil.WriteError
var writeMethodNotAllowed = httputil.WriteMethodNotAllowed
var parseQueryInt = httputil.ParseQueryInt
