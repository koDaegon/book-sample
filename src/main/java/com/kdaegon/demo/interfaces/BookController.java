package com.kdaegon.demo.interfaces;

import com.kdaegon.demo.application.BookService;
import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.interfaces.dto.CommonBookMessage;
import com.kdaegon.demo.interfaces.transform.CommonBookMapper;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@SuppressWarnings("unchecked")
public class BookController {

    private final BookService bookService;
    private final CommonBookMapper commonBookMapper;

    @GetMapping("/{value}")
    public String echo(@PathVariable String value) {
        return "Request Url : " + value;
    }

    @GetMapping("/books/{bookId}")
    public ResponseEntity<CommonBookMessage> getBook(@PathVariable("bookId") final Long id) {
        Book book = bookService.get(id);
        return new ResponseEntity<>(commonBookMapper.toDto(book), HttpStatus.OK);
    }

    @GetMapping("/books")
    public ResponseEntity<List<CommonBookMessage>> listBooks() {
        List<CommonBookMessage> list = bookService.getList()
                .stream()
                .map(b -> commonBookMapper.toDto(b))
                .collect(Collectors.toList());
        return new ResponseEntity<>(list, HttpStatus.OK);
    }

    @PostMapping("/books")
    public ResponseEntity<CommonBookMessage> createBook(@RequestBody final CommonBookMessage bookDto) {
        Book book = bookService.create(commonBookMapper.toEntity(bookDto));
        return new ResponseEntity<>(commonBookMapper.toDto(book), HttpStatus.OK);
    }

    @PutMapping("/books/{bookId}")
    public ResponseEntity<CommonBookMessage> updateBook(@PathVariable("bookId") final Long id, @RequestBody CommonBookMessage bookDto) {
        bookDto.setId(id);
        Book book = bookService.edit(commonBookMapper.toEntity(bookDto));
        return new ResponseEntity<>(commonBookMapper.toDto(book), HttpStatus.OK);
    }

    @DeleteMapping("/books/{bookId}")
    public ResponseEntity deleteBook(@PathVariable("bookId") final Long id) {
        bookService.delete(id);
        return new ResponseEntity(HttpStatus.OK);
    }

}

