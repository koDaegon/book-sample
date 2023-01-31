package com.kdaegon.demo.infrastructure.repositories.jpa;

import com.kdaegon.demo.domain.model.entity.Book;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookJpaRepository extends JpaRepository<Book, Long> {
}
