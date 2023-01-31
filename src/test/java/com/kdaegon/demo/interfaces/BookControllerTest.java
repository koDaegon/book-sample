package com.kdaegon.demo.interfaces;

import static org.junit.jupiter.api.Assertions.*;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.kdaegon.demo.application.BookService;
import com.kdaegon.demo.domain.model.entity.Book;
import com.kdaegon.demo.interfaces.dto.CommonBookMessage;
import com.kdaegon.demo.interfaces.transform.CommonBookMapper;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.annotation.AliasFor;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MockMvcBuilder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultHandler;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.hamcrest.core.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class BookControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BookService bookService;

    @Autowired
    private CommonBookMapper commonBookMapper;

    @Autowired
    private ObjectMapper objectMapper;

    private CommonBookMessage bookData;

    @BeforeEach
    void initialize() {

        Book bookEntity = commonBookMapper.toEntity(CommonBookMessage.builder()
                .title("Test_Title")
                .subTitle("Test_Sub_Title")
                .isbn("000-111-2222")
                .author("kdaegon")
                .build());

        bookEntity = bookService.create(bookEntity);
        bookData = commonBookMapper.toDto(bookEntity);
    }

    @Test
    @DisplayName("Testing BookController with POST Method")
    void postTest() throws Exception {

        CommonBookMessage bookRequest = CommonBookMessage.builder()
                .title("Test_Title2")
                .subTitle("Test_Sub_Title2")
                .isbn("000-111-2222")
                .author("kdaegon2")
                .build();

        final String sendPacket = objectMapper.writeValueAsString(bookRequest);

        mockMvc.perform(post("/books").contentType(MediaType.APPLICATION_JSON).content(sendPacket))
                .andExpect(status().isOk())
                .andDo(print())
                .andExpect(jsonPath("$.title").value(bookRequest.getTitle()))
                .andExpect(jsonPath("$.author").value(bookRequest.getAuthor()))
                .andExpect(jsonPath("$.book_id").value(IsNull.notNullValue()));
    }

    @Test
    @DisplayName("Testing BookController with GET Method")
    void getBookAPITest() throws Exception {
        mockMvc.perform(get("/books/" + bookData.getId()))
                .andExpect(jsonPath("$.title").value(bookData.getTitle()))
                .andExpect(jsonPath("$.book_id").value(bookData.getId()))
        ;
    }

    @Test
    @DisplayName("Testing BookController with PUT Method")
    void updateBookAPITest() throws Exception {
        final String sendData = objectMapper.writeValueAsString(CommonBookMessage.builder()
                .title("Test_Title_New")
                .subTitle("Test_Sub_Title_New")
                .isbn("000-111-2222")
                .author("daegon")
                .build());

        // 수정 API 호출
        mockMvc.perform(put("/books/" + bookData.getId()).contentType(MediaType.APPLICATION_JSON).content(sendData))
                .andExpect(status().isOk());

        // 다시 Get API 호출해서 결과 확인
        mockMvc.perform(get("/books/" + bookData.getId()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.author").value("daegon"));
    }

}

