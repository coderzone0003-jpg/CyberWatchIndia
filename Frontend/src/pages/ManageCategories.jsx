import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      setError(err.message || 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    
    try {
      await api.createCategory(newCategory);
      setShowAddModal(false);
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category');
    }
  };

  const handleEditCategory = async (e) => {
    e.preventDefault();
    
    try {
      await api.updateCategory(editingCategory.id, newCategory);
      setShowEditModal(false);
      setEditingCategory(null);
      setNewCategory({ name: '', description: '' });
      fetchCategories();
    } catch (err) {
      console.error('Failed to update category:', err);
      setError('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"? This may affect existing complaints.`)) {
      return;
    }

    try {
      await api.deleteCategory(categoryId);
      fetchCategories();
    } catch (err) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category');
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading categories...</p>
      </div>
    );
  }

  return (
    <>
        {error && (
          <div className="alert alert-danger mb-4" role="alert">
            {error}
          </div>
        )}
        
        <div className="contact-form p-4 rounded-4 shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Category Management</h4>
            <button 
              className="btn btn-success"
              onClick={() => setShowAddModal(true)}
            >
              Add Category
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4">
                      No categories found. Click "Add Category" to create one.
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        <strong>{category.name}</strong>
                      </td>
                      <td>{category.description || 'No description'}</td>
                      <td>{new Date(category.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => openEditModal(category)}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-outline-danger"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            title="Delete"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {categories.length > 0 && (
            <div className="mt-3 text-muted">
              Showing {categories.length} categor(y/ies)
            </div>
          )}
        </div>

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="add-category-title" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowAddModal(false)}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="add-category-title">Add New Category</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowAddModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form id="add-category-form" onSubmit={handleAddCategory}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="cat-name-add">Category Name *</label>
                      <input 
                        id="cat-name-add"
                        type="text" 
                        className="form-control"
                        name="name"
                        value={newCategory.name}
                        onChange={handleInputChange}
                        required
                        placeholder="e.g., UPI Fraud, Phishing"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="cat-desc-add">Description</label>
                      <textarea 
                        id="cat-desc-add"
                        className="form-control"
                        name="description"
                        value={newCategory.description}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Brief description of this crime category"
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" form="add-category-form">
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && (
          <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="edit-category-title" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setShowEditModal(false)}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title" id="edit-category-title">Edit Category</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form id="edit-category-form" onSubmit={handleEditCategory}>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="cat-name-edit">Category Name *</label>
                      <input 
                        id="cat-name-edit"
                        type="text" 
                        className="form-control"
                        name="name"
                        value={newCategory.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label" htmlFor="cat-desc-edit">Description</label>
                      <textarea 
                        id="cat-desc-edit"
                        className="form-control"
                        name="description"
                        value={newCategory.description}
                        onChange={handleInputChange}
                        rows="3"
                      />
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success" form="edit-category-form">
                    Update Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </>
  );
}

export default ManageCategories;