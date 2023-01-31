package com.kdaegon.demo.mapper;

/**
 * DTO <-> Entity 매핑 처리 자동화를 위한 부모 인터페이스.
 * <p>
 *    Lombok에 의해 자동으로 Implement 객체가 Generate 된다. <br/>
 *    다만, DTO와 Entity에 정의된 필드는 타입과 이름이 일치해야 한다.
 * </p>
 * @param <D> DTO 클래스
 * @param <E> Entity 클래스
 */
public interface GenericMapper<D, E> {
    D toDto(E e);
    E toEntity(D d);
}