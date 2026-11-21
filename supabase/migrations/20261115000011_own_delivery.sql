-- =============================================================================
-- 0011 · OWN DELIVERY
-- ManaBrand delivers itself and tracks by hand, so marking an order "shipped" no longer invents a tracking number or
-- says "Delhivery" — the delivery is "ManaBrand Delivery" and the tracking number is typed in on the order page.
-- Only the set_order_status function changes. Safe to run more than once.
-- =============================================================================
create or replace function public.set_order_status(p_order uuid, p_status public.order_status, p_note text default null) returns void
language plpgsql security definer set search_path = public as $$
declare v_o record; v_admin boolean := public.is_admin(); v_is_seller boolean;
begin
  select * into v_o from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;

  v_is_seller := exists (select 1 from public.order_items oi where oi.order_id = p_order and public.owns_seller(oi.seller_id));
  if not v_admin and not v_is_seller then raise exception 'Not allowed' using errcode = '42501'; end if;
  if p_status in ('cancelled', 'returned') then raise exception 'Use the cancel / return flow'; end if;
  if public.order_rank(p_status) <= public.order_rank(v_o.status) then raise exception 'Cannot move an order backwards'; end if;
  if not v_admin and (p_status not in ('confirmed', 'packed', 'shipped') or public.order_rank(p_status) <> public.order_rank(v_o.status) + 1) then
    raise exception 'Sellers can move an order one step at a time up to Shipped';
  end if;
  if v_o.status in ('cancelled', 'returned', 'delivered') then raise exception 'This order is closed'; end if;

  update public.orders set status = p_status,
         courier = case when p_status = 'shipped' and courier is null then 'ManaBrand Delivery' else courier end,
         payment_status = case when p_status = 'delivered' and payment_method = 'cod' then 'paid' else payment_status end
   where id = p_order;
  insert into public.order_events (order_id, status, note)
  values (p_order, p_status, coalesce(nullif(btrim(p_note), ''), 'Updated to ' || replace(p_status::text, '_', ' ')));
  perform public.notify(v_o.user_id, 'user', 'order', 'Order ' || v_o.number || ': ' || replace(p_status::text, '_', ' '), 'Your order status was updated.');
end $$;
