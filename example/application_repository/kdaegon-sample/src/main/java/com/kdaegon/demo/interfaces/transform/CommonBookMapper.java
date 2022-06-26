package com.kdaegon.demo.interfaces.transform;

import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.interfaces.dto.CommonBookMessage;
import com.kdaegon.demo.mapper.GenericMapper;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CommonBookMapper extends GenericMapper<CommonBookMessage, Book> {
}
