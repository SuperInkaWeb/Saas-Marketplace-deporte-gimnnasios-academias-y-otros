import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { CreateProductDto, CreateOrderDto } from './dto/marketplace.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('products/:gymId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Añadir un producto a la tienda (Dueño)' })
  createProduct(
    @Param('gymId') gymId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateProductDto,
  ) {
    return this.marketplaceService.createProduct(gymId, user.id, dto);
  }

  @Get('products')
  @ApiOperation({ summary: 'Listar productos disponibles' })
  @ApiQuery({ name: 'gymId', required: false })
  findAllProducts(@Query('gymId') gymId?: string) {
    return this.marketplaceService.findAllProducts(gymId);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.GYM_OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un producto de la tienda' })
  deleteProduct(@Param('id') id: string, @CurrentUser() user: any) {
    return this.marketplaceService.deleteProduct(id, user.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Realizar un pedido en la tienda' })
  createOrder(@CurrentUser() user: any, @Body() dto: CreateOrderDto) {
    return this.marketplaceService.createOrder(user.id, dto);
  }

  @Get('orders/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver mis pedidos' })
  getMyOrders(@CurrentUser() user: any) {
    return this.marketplaceService.getMyOrders(user.id);
  }
}
