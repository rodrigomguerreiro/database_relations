import AppError from '@shared/errors/AppError';
import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = this.ormRepository.findOne({
      where: { name },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const listId = products.map(product => product.id);
    const listOrder = await this.ormRepository.find({ id: In(listId) });

    if (listId.length !== listOrder.length) {
      throw new AppError('Missing Product');
    }

    return listOrder;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const allProducts = await this.findAllById(products);

    const updatedProducts = allProducts.map(allProduct => {
      const findProduct = products.find(produc => produc.id === allProduct.id);

      if (!findProduct) {
        throw new AppError('Product not find');
      }

      if (allProduct.quantity < findProduct.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      const newProduct = allProduct;

      newProduct.quantity -= findProduct.quantity;

      return newProduct;
    });

    await this.ormRepository.save(updatedProducts);

    return updatedProducts;
  }
}

export default ProductsRepository;
