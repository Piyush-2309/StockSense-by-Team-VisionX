package com.stocksense.service;

import com.stocksense.dto.inventory.CategoryRequest;
import com.stocksense.dto.inventory.CategoryResponse;
import com.stocksense.entity.Category;
import com.stocksense.exception.ResourceNotFoundException;
import com.stocksense.mapper.InventoryMapper;
import com.stocksense.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(InventoryMapper::toCategoryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return InventoryMapper.toCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .active(true)
                .build();

        category = categoryRepository.save(category);
        log.info("Created category: {}", category.getName());
        return InventoryMapper.toCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        category.setName(request.getName());
        category.setDescription(request.getDescription());

        category = categoryRepository.save(category);
        log.info("Updated category: {}", category.getName());
        return InventoryMapper.toCategoryResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        category.setActive(false);
        categoryRepository.save(category);
        log.info("Deactivated category: {}", category.getName());
    }
}
