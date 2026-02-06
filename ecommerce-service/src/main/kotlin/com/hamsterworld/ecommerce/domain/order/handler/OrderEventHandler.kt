package com.hamsterworld.ecommerce.domain.order.handler

import com.hamsterworld.ecommerce.domain.order.repository.OrderRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Component
import org.springframework.transaction.event.TransactionalEventListener

@Component
class OrderEventHandler(
    private val orderRepository: OrderRepository
) {
    private val log = LoggerFactory.getLogger(OrderEventHandler::class.java)

//    @TransactionalEventListener
//    fun handle(event: OrderStatusChangedEvent) {
//    }
}
