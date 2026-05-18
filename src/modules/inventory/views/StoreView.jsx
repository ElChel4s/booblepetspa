import { useState } from 'react';
import { products } from '../../../utils/data';
import FilterPanel from '../components/FilterPanel';
import ProductCard from '../components/ProductCard';

/**
 * StoreView — Vista principal de la tienda (rol cliente/groomer).
 * Gestiona el estado de filtros y el grid Bento de productos.
 */
const StoreView = ({ onAddToCart, isAdded }) => {
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [petType, setPetType] = useState('Ambos');
  const [onlyStock, setOnlyStock] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');

  const handleClearFilters = () => {
    setActiveCategory('Todos');
    setPetType('Ambos');
    setOnlyStock(false);
    setSortBy('default');
    setSearchQuery('');
  };

  const filteredProducts = products
    .filter((p) => activeCategory === 'Todos' || p.category === activeCategory)
    .filter((p) => petType === 'Ambos' || p.petType === petType || p.petType === 'Ambos')
    .filter((p) => (onlyStock ? p.stock > 0 : true))
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <FilterPanel
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        petType={petType} setPetType={setPetType}
        sortBy={sortBy} setSortBy={setSortBy}
        onlyStock={onlyStock} setOnlyStock={setOnlyStock}
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        onClearFilters={handleClearFilters}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 auto-rows-auto gap-12 grid-flow-dense pb-24 px-2">
        {filteredProducts.map((item, index) => (
          <ProductCard
            key={item.id}
            item={item}
            index={index}
            onAddToCart={onAddToCart}
            isAdded={isAdded}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreView;
