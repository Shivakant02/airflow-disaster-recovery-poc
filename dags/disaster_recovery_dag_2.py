"""
Disaster Recovery DAG 2
This DAG runs hourly and contains 4 tasks for disaster recovery testing
"""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.empty import EmptyOperator

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

def backup_task_function(**context):
    """Backup processing task"""
    print(f"Executing Backup Task at {datetime.now()}")
    print("Creating backup snapshots...")
    return "Backup task completed successfully"

def validation_task_function(**context):
    """Validation processing task"""
    print(f"Executing Validation Task at {datetime.now()}")
    print("Validating backup integrity...")
    return "Validation task completed successfully"

with DAG(
    'disaster_recovery_dag_2',
    default_args=default_args,
    description='Disaster Recovery DAG 2 - Hourly Backup and Validation',
    schedule_interval='@hourly',
    start_date=datetime(2025, 11, 1),
    catchup=False,
    tags=['disaster-recovery', 'hourly', 'backup'],
) as dag:

    # Start task
    start = EmptyOperator(
        task_id='start',
        dag=dag,
    )

    # Task 1 - Backup
    backup_task = PythonOperator(
        task_id='create_backup',
        python_callable=backup_task_function,
        provide_context=True,
        dag=dag,
    )

    # Task 2 - Validation
    validation_task = PythonOperator(
        task_id='validate_backup',
        python_callable=validation_task_function,
        provide_context=True,
        dag=dag,
    )

    # End task
    end = EmptyOperator(
        task_id='end',
        dag=dag,
    )

    # Define task dependencies
    start >> backup_task >> validation_task >> end
