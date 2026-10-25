begin;
select plan(4);

select is(private.qty_text(1, 'bag'), '1 bag', 'one bag');
select is(private.qty_text(10, 'bag'), '10 bags', 'ten bags');
select is(private.qty_text(2, 'box'), '2 boxes', 'two boxes');
select is(private.qty_text(3, 'case'), '3 cases', 'three cases');

select * from finish();
rollback;
