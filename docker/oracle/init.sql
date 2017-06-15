create user SDE identified by SDE default tablespace users temporary tablespace temp;
grant connect to SDE;
grant resource to SDE;
grant unlimited tablespace to SDE;
grant select any table to SDE;

alter user SDE grant connect through system;
connect system[SDE]/oracle

create table dummy as (select * from dual);
create table SDE.GDB_ITEMS_VW (
	UUID varchar(38) not null, 
	GEODROPINID varchar(38) not null, 
	TYPE varchar(38) not null, 
	PHYSICALNAME nvarchar2(452) not null, 
	DOCUMENTATION clob not null, 
	constraint pk_uuid primary key(UUID), 
	constraint geodropinid_unique unique(GEODROPINID));