package com.kdaegon.demo.infrastructure.repositories.jpa;

import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.exception.NoDataFoundException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Repository Basic Test")
@SpringBootTest
class BookJpaRepositoryTest {

    @Autowired
    private BookJpaRepository bookRepository;
    private Book book;

    @BeforeEach
    void initialize() {
        Book book = Book.builder()
                .title("Test_Title")
                .subTitle("Test_Sub_Title")
                .isbn("000-111-2222")
                .author("kdaegon")
                .build();
        this.book = this.bookRepository.save(book);
    }

    @Test
    @DisplayName("Testing BookRepository")
    void GetBook() {
        Assertions.assertNotNull(book);

        Book testBook = bookRepository.findById(book.getId()).orElseThrow(() -> new NoDataFoundException(""));

        Assertions.assertNotNull(testBook);
        Assertions.assertEquals(testBook.getId(), book.getId());
        Assertions.assertEquals(testBook.getTitle(), book.getTitle());

    }

    @Test
    @DisplayName("Testing BookRepository with modify")
    void UpdateBook() {
        Book newBook = Book.builder()
                .title("New_Title")
                .subTitle("New_Sub_Title")
                .isbn("333-444-5555")
                .author("unknown")
                .build();

        book.modify(newBook);
        Book result = this.bookRepository.save(book);
        assertThat(result.getTitle()).isEqualTo(newBook.getTitle());
    }

}