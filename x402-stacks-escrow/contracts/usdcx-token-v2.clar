(define-fungible-token usdcx)

(define-public (mint (amount uint) (recipient principal))
  (begin
    (try! (ft-mint? usdcx amount recipient))
    (ok true)
  )
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (try! (ft-transfer? usdcx amount sender recipient))
    (ok true)
  )
)

(define-read-only (get-balance (user principal))
  (ok (ft-get-balance usdcx user))
)