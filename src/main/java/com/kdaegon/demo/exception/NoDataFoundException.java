package com.kdaegon.demo.exception;

public class NoDataFoundException extends RuntimeException {

    public NoDataFoundException(String dataName) {
        super(String.format("no data(%s) found", dataName));
    }
}
