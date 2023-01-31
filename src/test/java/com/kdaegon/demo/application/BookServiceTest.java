package com.kdaegon.demo.application;

import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.infrastructure.repositories.jpa.BookJpaRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.mockito.Mockito.doReturn;
import static org.mockito.ArgumentMatchers.any;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @InjectMocks
    private BookService bookService;

    @Mock
    private BookJpaRepository bookRepository;

    @Test
    @DisplayName("Testing BookService")
    void BookServiceTest() {
        doReturn(Optional.of(Book.builder()
                .title("Hello")
                .subTitle("World")
                .author("Kim")
                .isbn("000-222-9999")
                .build())).when(bookRepository).findById(any());
        Book result = bookService.get(1L);

        assertThat(result.getTitle()).isEqualTo("Hello");
    }

}