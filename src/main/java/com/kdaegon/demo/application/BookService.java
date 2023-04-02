package com.kdaegon.demo.application;

import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.exception.NoDataFoundException;
import com.kdaegon.demo.infrastructure.repositories.jpa.BookJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookService {
    private final BookJpaRepository bookJpaRepository;

    @Transactional
    public Book create(Book book) {
        return bookJpaRepository.save(book);
    }

    @Transactional(readOnly = true)
    public Book get(Long id) {
        return bookJpaRepository.findById(id).orElseThrow(() -> new NoDataFoundException(id.toString()));
    }

    @Transactional(readOnly = true)
    public List<Book> getList(){
        return bookJpaRepository.findAll();
    }

    @Transactional
    public Book edit(final Book book) {
        Book bookRecord = bookJpaRepository.findById(book.getId()).orElseThrow(() -> new NoDataFoundException(book.getId().toString()));
        return bookRecord.modify(book);
    }

    @Transactional
    public void delete(Long id) {
        bookJpaRepository.deleteById(id);
    }
}
