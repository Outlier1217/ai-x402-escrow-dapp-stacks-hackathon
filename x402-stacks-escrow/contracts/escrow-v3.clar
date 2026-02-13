(define-constant admin 'STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q)
(define-constant token-contract 'STXWF905DFSCWN77QNNWFHSFXPF73ZP02H05X5Q.usdcx-token-v2)
(define-data-var order-counter uint u0)

(define-map orders
  { order-id: uint }
  {
    buyer: principal,
    product-id: uint,
    amount: uint,
    item-count: uint,
    status: uint
  }
)

;; STATUS
;; 0 = Hold
;; 1 = Released
;; 2 = Refunded
;; 3 = Rejected

;; =========================
;; DEPOSIT
;; =========================
(define-public (deposit (product-id uint) (amount uint) (item-count uint))

  (let (
        (new-id (+ (var-get order-counter) u1))
        (is-single (is-eq item-count u1))
       )

    ;; Transfer from user to escrow (escrow acts as middle layer logically)
    (try!
      (contract-call? token-contract transfer
        amount
        tx-sender
        admin
      )
    )

    (var-set order-counter new-id)

    (map-set orders
      { order-id: new-id }
      {
        buyer: tx-sender,
        product-id: product-id,
        amount: amount,
        item-count: item-count,
        status: (if is-single u1 u0)
      }
    )

    (ok new-id)
  )
)

;; =========================
;; ADMIN RELEASE
;; =========================
(define-public (admin-release (order-id uint))

  (let ((order (unwrap! (map-get? orders { order-id: order-id }) (err u404))))

    (asserts! (is-eq tx-sender admin) (err u403))
    (asserts! (is-eq (get status order) u0) (err u400))

    (map-set orders
      { order-id: order-id }
      (merge order { status: u1 })
    )

    (ok true)
  )
)

;; =========================
;; ADMIN REJECT
;; =========================
(define-public (admin-reject (order-id uint))

  (let ((order (unwrap! (map-get? orders { order-id: order-id }) (err u404))))

    (asserts! (is-eq tx-sender admin) (err u403))
    (asserts! (is-eq (get status order) u0) (err u400))

    ;; refund buyer
    (try!
      (contract-call? token-contract transfer
        (get amount order)
        admin
        (get buyer order)
      )
    )

    (map-set orders
      { order-id: order-id }
      (merge order { status: u3 })
    )

    (ok true)
  )
)

(define-read-only (get-order (order-id uint))
  (map-get? orders { order-id: order-id })
)